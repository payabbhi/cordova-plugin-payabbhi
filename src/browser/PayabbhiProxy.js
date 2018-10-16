function injectCheckoutScript(callback) {
  var rjs = document.getElementsByTagName("script")[0];
  var js = document.getElementById("Payabbhi-jssdk");
  if (js) return;

  js = document.createElement("script");
  js.id = "Payabbhi-jssdk";
  js.onload = function() {
    if (typeof callback === "function") callback();
  };

  js.onerror = function() {
    if (typeof callback === "function")
      callback({
        code: 3,
        description: "Network error"
      });
  };

  js.src = "https://checkout.payabbhi.com/v1/checkout.js";
  rjs.parentNode.insertBefore(js, rjs);
}
injectCheckoutScript();

function open(successCallback, cancelCallback, args) {
  options = args[0];
  options.handler = function(response) {
    successCallback(response);
  };
  options.modal = options.modal || {};
  options.modal.ondismiss = function() {
    cancelCallback({
      code: 2,
      message: "Payment cancelled by user"
    });
  };

  if (window.Payabbhi) {
    openPayabbhi(options);
  } else {
    injectCheckoutScript(function(error) {
      if (error.code === 3) {
        cancelCallback(error);
      } else {
        openPayabbhi(options);
      }
    });
  }
}

function openPayabbhi(options) {
  var payabbhi = new Payabbhi(options);
  payabbhi.open(options);
}

module.exports = {
  open: open
};

require("cordova/exec/proxy").add("PayabbhiCheckout", module.exports);
