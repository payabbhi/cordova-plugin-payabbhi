var successCallback = function(done) {
  return function() {
    expect(true).toBe(true);
    done();
  };
};

var errorCallback = function(done) {
  return function() {
    expect(false).toBe(false);
    done();
  };
};

exports.defineAutoTests = function() {
  describe("cordova-plugin-payabbhi", function() {
    it("Should Exist", function() {
      expect(PayabbhiCheckout).toBeDefined(true);
    });
  });

  describe("PayabbhiCheckout.open()", function() {
    it("Should Exist", function() {
      expect(PayabbhiCheckout.open).toBeDefined(true);
    });

    it("Should return INVALID_ARGUMENTS with undefined options", function() {
      expect(function() {
        PayabbhiCheckout.open();
      }).toThrow({
        code: PayabbhiCheckout.INVALID_ARGUMENTS,
        message: "options not defined"
      });
    });

    it("Should invoke errorCallback with INVALID_ARGUMENTS for empty options", function() {
      var options = {};
      PayabbhiCheckout.open(options, successCallback, function(error) {
        expect(error).toEqual({
          code: PayabbhiCheckout.INVALID_ARGUMENTS,
          message: "Access id not provided"
        });
      });
    });

    it("Should throw an error when success callback function is not provided", function() {
      var options = {
        access_id: "test_access_id"
      };
      expect(function() {
        PayabbhiCheckout.open(options);
      }).toThrow({
        code: PayabbhiCheckout.INVALID_ARGUMENTS,
        message: "SuccessCallback not implemented"
      });
    });

    it("Should set options.plugin to 'cordova'", function() {
      var options = {
        access_id: "test_access_id",
        order_id: "test_order"
      };
      PayabbhiCheckout.open(options, successCallback, errorCallback);
      expect(options.plugin).toEqual("cordova");
    });

    it("Should throw an error when error callback function is not provided", function() {
      var options = {
        access_id: "test_access_id"
      };
      expect(function() {
        PayabbhiCheckout.open(options, successCallback);
      }).toThrow({
        code: PayabbhiCheckout.INVALID_ARGUMENTS,
        message: "ErrorCallback not implemented"
      });
    });

    describe("PayabbhiCheckout.onResume()", function() {
      it("Should Exist", function() {
        expect(PayabbhiCheckout.onResume).toBeDefined(true);
      });

      it("Should call errorCallback if pluginStatus is error", function() {
        var event = {
          pendingResult: {
            pluginServiceName: PayabbhiCheckout.PLUGIN_NAME,
            pluginStatus: "Error",
            result: {
              code: "code",
              message: "message"
            }
          }
        };
        PayabbhiCheckout.onResume(event, successCallback, function(error) {
          expect(error).toEqual(event.pendingResult.result);
        });
      });

      it("Should call succeCallback if pluginStatus is ok", function() {
        var event = {
          pendingResult: {
            pluginServiceName: PayabbhiCheckout.PLUGIN_NAME,
            pluginStatus: "OK",
            result: {
              code: "code",
              message: "message"
            }
          }
        };
        PayabbhiCheckout.onResume(
          event,
          function(success) {
            expect(success).toEqual(event.pendingResult.result);
          },
          errorCallback
        );
      });
    });

    describe("Exported error codes", function() {
      it("INVALID_ARGUMENTS Should be defined and equal to 1", function() {
        expect(PayabbhiCheckout.INVALID_ARGUMENTS).toEqual(1);
      });

      it("PAYMENT_CANCELED Should be defined and equal to 2", function() {
        expect(PayabbhiCheckout.PAYMENT_CANCELED).toEqual(2);
      });

      it("NETWORK_ERROR Should be defined and equal to 3", function() {
        expect(PayabbhiCheckout.NETWORK_ERROR).toEqual(3);
      });
    });
  });
};
