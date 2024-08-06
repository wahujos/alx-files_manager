const Bull = require('bull');
const { ObjectId } = require('mongodb');
const DBClient = require('./utils/db');
const nodemailer = require('nodemailer');

const userQueue = new Bull('userQueue');

// Configure nodemailer (assuming you're using a real SMTP service or similar)
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  const user = await DBClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) throw new Error('User not found');

  const { email } = user;

  // Send a welcome email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome!',
      text: `Welcome ${email}!`
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
});

module.exports = userQueue;
