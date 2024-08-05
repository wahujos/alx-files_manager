// controllers/AppController.js

const AppController = {
  getStatus(req, res) {
    return res.status(200).json({ status: 'OK' });
  }
};

export default AppController;
