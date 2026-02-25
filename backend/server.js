const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = 8208;
const TEAM_ID = "team_rdf";
const MQTT_BROKER = "mqtt://157.173.101.159:1883";
const MONGO_URI = process.env.MONGODB_URI;

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Card Schema
const cardSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  holderName: { type: String, required: true },
  balance: { type: Number, default: 0 },
  lastTopup: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Card = mongoose.model('Card', cardSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  holderName: { type: String, required: true },
  type: { type: String, enum: ['topup', 'debit'], default: 'topup' },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Product catalog
const PRODUCTS = [
  { id: 'coffee', name: 'Coffee', price: 2.50, icon: '☕' },
  { id: 'sandwich', name: 'Sandwich', price: 5.00, icon: '🥪' },
  { id: 'water', name: 'Water Bottle', price: 1.00, icon: '💧' },
  { id: 'snack', name: 'Snack Pack', price: 3.00, icon: '🍿' },
  { id: 'juice', name: 'Fresh Juice', price: 3.50, icon: '🧃' },
  { id: 'salad', name: 'Salad Bowl', price: 6.00, icon: '🥗' }
];

// Topics
const TOPIC_STATUS = `rfid/${TEAM_ID}/card/status`;
const TOPIC_BALANCE = `rfid/${TEAM_ID}/card/balance`;
const TOPIC_TOPUP = `rfid/${TEAM_ID}/card/topup`;
const TOPIC_PAYMENT = `rfid/${TEAM_ID}/card/payment`;

// MQTT Client Setup
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  mqttClient.subscribe(TOPIC_STATUS);
  mqttClient.subscribe(TOPIC_BALANCE);
  mqttClient.subscribe(TOPIC_PAYMENT);
});

mqttClient.on('message', (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
  try {
    const payload = JSON.parse(message.toString());

    if (topic === TOPIC_STATUS) {
      io.emit('card-status', payload);
    } else if (topic === TOPIC_BALANCE) {
      io.emit('card-balance', payload);
    } else if (topic === TOPIC_PAYMENT) {
      io.emit('payment-result', payload);
    }
  } catch (err) {
    console.error('Failed to parse MQTT message:', err);
  }
});

// HTTP Endpoints
app.post('/topup', async (req, res) => {
  const { uid, amount, holderName } = req.body;

  if (!uid || amount === undefined) {
    return res.status(400).json({ error: 'UID and amount are required' });
  }

  try {
    // Find or create card
    let card = await Card.findOne({ uid });
    const balanceBefore = card ? card.balance : 0;

    if (!card) {
      if (!holderName) {
        return res.status(400).json({ error: 'Holder name is required for new cards' });
      }
      card = new Card({ uid, holderName, balance: amount, lastTopup: amount });
    } else {
      // Cumulative topup: add to existing balance
      card.balance += amount;
      card.lastTopup = amount;
      card.updatedAt = Date.now();
    }

    await card.save();

    // Create transaction record
    const transaction = new Transaction({
      uid: card.uid,
      holderName: card.holderName,
      type: 'topup',
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: card.balance,
      description: `Top-up of $${amount.toFixed(2)}`
    });
    await transaction.save();

    // Publish to MQTT with updated balance
    const payload = JSON.stringify({ uid, amount: card.balance });
    mqttClient.publish(TOPIC_TOPUP, payload, (err) => {
      if (err) {
        console.error('Failed to publish topup:', err);
        return res.status(500).json({ error: 'Failed to publish topup command' });
      }
      console.log(`Published topup for ${uid} (${card.holderName}): ${card.balance}`);
    });

    res.json({
      success: true,
      message: 'Topup successful',
      card: {
        uid: card.uid,
        holderName: card.holderName,
        balance: card.balance,
        lastTopup: card.lastTopup
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        timestamp: transaction.timestamp
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Payment / Debit endpoint
app.post('/pay', async (req, res) => {
  const { uid, productId, amount, description } = req.body;

  if (!uid || (!productId && amount === undefined)) {
    return res.status(400).json({ error: 'UID and product or amount are required' });
  }

  try {
    // Resolve amount from product catalog or use direct amount
    let payAmount = amount;
    let payDescription = description || 'Payment';

    if (productId) {
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }
      payAmount = product.price;
      payDescription = `Purchase: ${product.name}`;
    }

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // Find card
    const card = await Card.findOne({ uid });
    if (!card) {
      return res.status(404).json({ error: 'Card not found. Please top up first.' });
    }

    // Check sufficient balance
    if (card.balance < payAmount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        currentBalance: card.balance,
        required: payAmount,
        shortfall: payAmount - card.balance
      });
    }

    const balanceBefore = card.balance;

    // Deduct amount
    card.balance -= payAmount;
    card.updatedAt = Date.now();
    await card.save();

    // Create transaction record
    const transaction = new Transaction({
      uid: card.uid,
      holderName: card.holderName,
      type: 'debit',
      amount: payAmount,
      balanceBefore: balanceBefore,
      balanceAfter: card.balance,
      description: payDescription
    });
    await transaction.save();

    // Publish to MQTT so ESP8266 updates
    const payload = JSON.stringify({
      uid,
      amount: card.balance,
      deducted: payAmount,
      description: payDescription,
      status: 'success'
    });
    mqttClient.publish(TOPIC_PAYMENT, payload, (err) => {
      if (err) {
        console.error('Failed to publish payment:', err);
      }
      console.log(`Published payment for ${uid} (${card.holderName}): -$${payAmount.toFixed(2)}, balance: $${card.balance.toFixed(2)}`);
    });

    // Emit real-time update via WebSocket
    io.emit('payment-success', {
      uid: card.uid,
      holderName: card.holderName,
      amount: payAmount,
      balanceBefore,
      balanceAfter: card.balance,
      description: payDescription,
      timestamp: transaction.timestamp
    });

    res.json({
      success: true,
      message: 'Payment successful',
      card: {
        uid: card.uid,
        holderName: card.holderName,
        balance: card.balance
      },
      transaction: {
        id: transaction._id,
        type: 'debit',
        amount: payAmount,
        balanceBefore,
        balanceAfter: card.balance,
        description: payDescription,
        timestamp: transaction.timestamp
      }
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Products catalog endpoint
app.get('/products', (req, res) => {
  res.json(PRODUCTS);
});

// Get card details
app.get('/card/:uid', async (req, res) => {
  try {
    const card = await Card.findOne({ uid: req.params.uid });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Get all cards
app.get('/cards', async (req, res) => {
  try {
    const cards = await Card.find().sort({ updatedAt: -1 });
    res.json(cards);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Get transaction history for a specific card
app.get('/transactions/:uid', async (req, res) => {
  try {
    const transactions = await Transaction.find({ uid: req.params.uid })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to last 50 transactions
    res.json(transactions);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Get all transactions (optional - for admin view)
app.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(transactions);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Socket connectivity
io.on('connection', (socket) => {
  console.log('User connected to the dashboard');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from: http://157.173.101.159:${PORT}`);
});
