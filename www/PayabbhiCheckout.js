var exec = require("cordova/exec");

var PayabbhiCheckout = {
  PLUGIN_NAME: "PayabbhiCheckout",
  PLUGIN_ACTION: "open",
  INVALID_ARGUMENTS: 1,
  PAYMENT_CANCELED: 2,
  NETWORK_ERROR: 3,

  open: function(options, successCallback, errorCallback) {
    if (typeof options !== "object") {
      throw {
        code: this.INVALID_ARGUMENTS,
        message: "options not defined"
      };
    }

    if (options.access_id === undefined) {
      errorCallback({
        code: this.INVALID_ARGUMENTS,
        message: "Access id not provided"
      });
      return;
    }

    if (typeof successCallback !== "function") {
      throw {
        code: this.INVALID_ARGUMENTS,
        message: "SuccessCallback not implemented"
      };
    }

    if (typeof errorCallback !== "function") {
      throw {
        code: this.INVALID_ARGUMENTS,
        message: "ErrorCallback not implemented"
      };
    }

    options.plugin = "cordova";
    exec(successCallback, errorCallback, this.PLUGIN_NAME, this.PLUGIN_ACTION, [
      options
    ]);
  },

  onResume: function(event, successCallback, errorCallback) {
    if (
      event.pendingResult &&
      event.pendingResult.pluginServiceName === this.PLUGIN_NAME
    ) {
      if (event.pendingResult.pluginStatus === "Error") {
        errorCallback(event.pendingResult.result);
      } else if (event.pendingResult.pluginStatus === "OK") {
        successCallback(event.pendingResult.result);
      }
    }
  }
};

module.exports = PayabbhiCheckout;
