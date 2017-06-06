'use strict';
const util = require('util');
const EventEmitter = require('events');
const SerialPort = require('serialport');

/**
 * SerialPort device
 * @param {[type]} port
 * @param {[type]} options
 */
function Serial(port, options) {
  var self = this;
  options = options || {
    baudrate: 9600,
    autoOpen: false
  };

  this.device = new SerialPort(port, options);
  this.device.on('close', function () {
    self.emit('disconnect', self.device);
    self.device = null;
  });

  this.device.on('data', data => this.handleMessageReceived(data));

  EventEmitter.call(this);
  return this;
};

util.inherits(Serial, EventEmitter);

/**
 * open deivce
 * @param  {Function} callback
 * @return {[type]}
 */
Serial.prototype.open = function (callback) {
  this.device.open(callback);
  return this;
};

/**
 * write data to serialport device
 * @param  {[type]}   buf      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Serial.prototype.write = function (data, callback) {
  Serial.prototype._statusCallback = (statusCode) => {
    if (statusCode === 22) {
      this.device.write(data, (err, bytesWritten) => {
        if (err) {
          callback(err, null)
        } else {
          callback(null, bytesWritten);
        }
      });
    } else {
      callback('printer drawer is open or there is no paper', null)
    }
    Serial.prototype._statusCallback = null;
  }
  this.device.write(Buffer.from([16, 4, 1, 0]));

  setTimeout(() => {
    if (Serial.prototype._statusCallback) {
      callback('unable to get status response from printer in time', null);
    }
    Serial.prototype._statusCallback = null;
  }, 10);

  return this;
};

/**
 * close device
 * @return {[type]} [description]
 */
Serial.prototype.close = function (callback) {
  var self = this;
  this.device.drain(function (err) {
    self.device.close();
    self.device = null;
    callback && callback(err, self.device);
  });
  return this;
};

Serial.prototype._statusCallback = null;

Serial.prototype.handleMessageReceived = message => {
  if (message.length > 0 && Serial.prototype._statusCallback) {
    Serial.prototype._statusCallback(message[0]);
  }
}
/**
 * expose
 */
module.exports = Serial;
