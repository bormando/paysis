const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuid } = require('uuid');
const app = express();
require('dotenv').config();

const credentials = {
  login: process.env.USER_LOGIN,
  password: process.env.USER_PASSWORD
};

let data = {
  users: [],
  transactions: [],
  minimumAmount: +process.env.INITIAL_AMOUNT,
  numberOfEntries: +process.env.NUMBER_OF_ENTRIES
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function isAuthValid (req, res) {
  const token = req.header('Authorization');
  if (token) {
    if (token.includes(credentials.token)) {
      return true;
    } else {
      res.status(400).send({ 'message': 'Wrong auth token.' });
      return false;
    }
  } else {
    res.status(404).send({ 'message': 'Unauthorized.' });
    return false;
  }
}

function findUser(id) {
  for (const entry of data.users) {
    if (id === entry.id) { return data.users.indexOf(entry) }
  }
  return false;
}

function findTransaction(id) {
  for (const entry of data.transactions) {
    if (id === entry.id) { return data.transactions.indexOf(entry) }
  }
  return false;
}

function userHasEnoughMoney(index, amount) {
  return data.users[index].amount >= amount;
}

function isAmountValid(amount) {
  return typeof(amount) === 'number';
}

function transferMoney(indexFrom, indexTo, amount) {
  data.users[indexFrom].amount -= amount;
  data.users[indexTo].amount += amount;
}

app.post('/auth', function (req, res) {
  const body = req.body;
  if ((Object.keys(body).length > 0) && 'login' in body && 'password' in body) {
    if (body.login === credentials.login && body.password === credentials.password) {
      if (!('token' in credentials)) { credentials.token = uuid() }
      res.status(200).send({ 'token': credentials.token });
    } else {
      res.status(404).send({ 'message': 'Wrong login or password.' });
    }
  } else {
    res.status(400).send({ 'message': 'No credentials provided.' });
  }
});

app.post('/users', function (req, res) {
  if (!isAuthValid(req, res)) { return }
  if (data.numberOfEntries <= data.users.length) {
    res.status(400).send({ 'message': 'Maximum number of users reached.' });
    return;
  }
  const newUser = {
    id: uuid(),
    amount: data.minimumAmount
  };
  data.users.push(newUser);
  res.status(200).send(newUser);
});

app.delete('/users', function (req, res) {
  if (isAuthValid(req, res)) {
    const id = req.body.id;
    const index = findUser(id);
    if (typeof(index) === 'number') {
      data.users.splice(index, 1);
      res.status(200).send({ 'message': 'User deleted.' });
    } else {
      res.status(400).send({ 'message': 'No user found.' });
    }
  }
});

app.get('/users', function (req, res) {
  if (isAuthValid(req, res)) {
    const id = req.query.id;
    if (id) {
      const index = findUser(id);
      if (typeof(index) === 'number') {
        res.status(200).send(data.users[index]);
      } else {
        res.status(400).send({ 'message': 'No user found.' })
      }
    } else {
      res.status(200).send(data.users);
    }
  }
});

app.post('/transactions', function (req, res) {
  if (!isAuthValid(req, res)) { return }
  if (data.numberOfEntries <= data.transactions.length) {
    res.status(400).send({ 'message': 'Maximum number of transactions reached.' });
    return;
  }
  const body = req.body;
  const { from, to, amount } = body;
  const indexFrom = findUser(from);
  if (typeof(indexFrom) !== 'number') {
    res.status(400).send({ 'message': 'Sender not found.' });
    return;
  }
  const indexTo = findUser(to);
  if (typeof(indexTo) !== 'number') {
    res.status(400).send({ 'message': 'Receiver not found.' });
    return;
  }
  if (!isAmountValid(amount)) {
    res.status(400).send({ 'message': 'Invalid amount to send.' });
    return;
  }
  if (!userHasEnoughMoney(indexFrom, amount)) {
    res.status(400).send({ 'message': 'Sender doesn\'t have enough money.' });
    return;
  }
  transferMoney(indexFrom, indexTo, amount);
  const newTransaction = {
    id: uuid(),
    from: from,
    to: to,
    amount: amount
  }
  data.transactions.push(newTransaction);
  res.status(200).send(newTransaction);
});

app.delete('/transactions', function (req, res) {
  if (isAuthValid(req, res)) {
    const body = req.body;
    const id = body.id;
    const indexTransaction = findTransaction(id);
    if (typeof(indexTransaction) !== 'number') {
      res.status(400).send({ 'message': 'Transaction not found.' });
      return;
    }
    const transaction = data.transactions[indexTransaction];
    const indexFrom = findUser(transaction.from);
    if (typeof(indexFrom) !== 'number') {
      res.status(400).send({ 'message': 'Sender doesn\'t exist anymore.' });
      return;
    }
    const indexTo = findUser(transaction.to);
    if (typeof(indexTo) !== 'number') {
      res.status(400).send({ 'message': 'Receiver doesn\'t exist anymore.' });
      return;
    }
    transferMoney(indexTo, indexFrom, transaction.amount);
    data.transactions.splice(indexTransaction, 1);
    res.status(200).send({ 'message': 'Transaction reverted.' });
  }
});

app.get('/transactions', function (req, res) {
  if (isAuthValid(req, res)) {
    const id = req.query.id;
    if (id) {
      const index = findTransaction(id);
      if (typeof(index) === 'number') {
        res.status(200).send(data.transactions[index]);
      } else {
        res.status(400).send({ 'message': 'No transaction found.' })
      }
    } else {
      res.status(200).send(data.transactions);
    }
  }
});

app.get('/config', function (req, res) {
  if (isAuthValid(req, res)) {
    const config = {
      number_of_entries: data.numberOfEntries,
      initial_amount: data.minimumAmount
    }
    res.status(200).send(config);
  }
});

app.patch('/config', function (req, res) {
  if (isAuthValid(req, res)) {
    const numberOfEntries = req.body.number_of_entries;
    const minimalAmount = req.body.initial_amount;
    const config = {
      number_of_entries: data.numberOfEntries,
      initial_amount: data.minimumAmount
    }
    if (numberOfEntries) {
      if (!isAmountValid(numberOfEntries)) {
        res.status(400).send({ 'message': 'Invalid number of entries.' });
        return;
      } else {
        if (numberOfEntries < 5 || numberOfEntries > 25) {
          res.status(400).send({ 'message': 'Number of entries must be between 5 and 25 (inclusively).' });
          return;
        }
        config.number_of_entries = numberOfEntries;
      }
    }
    if (minimalAmount) {
      if (!isAmountValid(minimalAmount)) {
        res.status(400).send({ 'message': 'Invalid minimal amount.' });
        return;
      } else {
        if (minimalAmount < 0) {
          res.status(400).send({ 'message': 'Amount must be above zero.' });
          return;
        }
        config.initial_amount = minimalAmount;
      }
    }
    data.minimumAmount = config.initial_amount;
    data.numberOfEntries = config.number_of_entries;
    res.status(200).send(config);
  }
});

app.delete('/config', function (req, res) {
  if (isAuthValid(req, res)) {
    data = {
      users: [],
      transactions: [],
      minimumAmount: +process.env.INITIAL_AMOUNT,
      numberOfEntries: +process.env.NUMBER_OF_ENTRIES
    };
    res.status(200).send({ 'message': 'Data wiped out.' })
  }
});

const port = +process.env.PORT;
app.listen(port);
console.log(`Server is running on port ${port}`);