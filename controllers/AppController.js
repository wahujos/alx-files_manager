import dbClient from '../utils/db'; // Adjust the path if necessary

export const getStatus = (req, res) => {
  const status = {
    redis: true,  // You would need to implement a Redis check if Redis is part of your stack
    db: dbClient.isAlive()
  };
  res.status(200).json(status);
};

export const getStats = async (req, res) => {
  try {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    const stats = {
      users: usersCount,
      files: filesCount
    };
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
};
