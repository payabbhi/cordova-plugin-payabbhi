# Payabbhi Plugin for Cordova / PhoneGap / Ionic

This Cordova / PhoneGap / Ionic plugin lets you use Payabbhi Native SDKs for Android and iOS as well as browser, for seamless integration with [Payabbhi Checkout](https://payabbhi.com/docs/checkout). The plugin can be used with Cordova / Ionic / PhoneGap applications.

## Installation

Add the plugin to your project.

```bash
cd your-project-folder
cordova plugin add cordova-plugin-payabbhi
```

## Supported platforms

- Android
- iOS
- Browser

## Adding platform

Add one or more platforms to your project.

### For Cordova applications

```bash
cordova platform add android  #for Android platform
cordova platform add ios      #for iOS platform
cordova platform add browser  #for browser platform
```

- The `Payabbhi.framework` included in this project is built in XCode version 9.3. To get the framework supporting your XCode version, visit <https://github.com/payabbhi/payabbhi-ios/releases> and replace the existing framework in the `src/ios` directory.

- On browser platform, change the [Content Security Policy](https://content-security-policy.com/) to whitelist the `payabbhi.com` domain.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self' https://*.payabbhi.com https://payabbhi.com data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *">
```

## Integration code

Make sure you have signed up for your [Payabbhi Account](https://payabbhi.com/docs/account) and downloaded the [API keys](https://payabbhi.com/docs/account/#api-keys) from the [Portal](https://payabbhi.com/portal).

You will need to instantiate `PayabbhiCheckout` and pass the [Checkout Configuration options](https://payabbhi.com/docs/checkout/#configuration-options) as below.

```javascript
var options = {
  access_id: <ACCESS_ID>,
  order_id: <ORDER_ID>,
  amount: 2000, //2000 paisa = Rs 20
  name: "Merchant Name",
  prefill: {
    name: "Bruce Wayne",
    email: "bruce@wayneinc.com",
    contact: "999999999999"
  },
};
```

It is expected that Server-side code (eg. Mobile Backend) would create an Order using Payabbhi [Order API](https://payabbhi.com/docs/api/#create-an-order) and pass the unique order_id in the Checkout configuration.

> TIP: You can generate a unique order_id using curl during development

```bash
curl https://payabbhi.com/api/v1/orders \
  -u access_id:secret_key \
  -d amount=10000 \
  -d merchant_order_id=ordRefNo123456 \
  -d currency=INR
```

Add callback functions to handle Payment outcome/s.

```javascript
var successCallback = function(response) {
  /**
   * Add your logic here for processing the Payment response on successful payment
   * It is expected that you would pass the Payment response
   * to your Server-side code (eg. Mobile Backend) for further processing
   */
   alert("payment_id: " + response.payment_id + " order_id: " + response.order_id + " payment signature: " + response.payment_signature);
};

var errorCallback = function(error) {
  /**
   * Add your logic here to handle scenarios where the Checkout did not result in a successful Payment
   */
  alert(error.message + "(" + error.code + ")");
};
```

`PayabbhiCheckout.open()` displays the Checkout form where the customer is able to provide his Card details or choose other payment options like NetBanking, Wallets etc.

```javascript
//NOTE: Typically PayabbhiCheckout.open should be called only after the ready event is fired
onDeviceReady: function() {
    PayabbhiCheckout.open(options, successCallback, errorCallback);
}
```

Once the payment is completed on the customer's device, Payabbhi will return the signed [Payment response](https://payabbhi.com/docs/checkout/#signed-payment-response) via callback to `successCallback` function (or return an error to `errorCallback` function).

### Verification of Signed Payment Response

Your mobile App should typically pass the signed Payment response to your server-side code (eg. Mobile Backend) for further processing. Your server-side code validates the signed Payment response, typically through [Verification using a Client Library](https://payabbhi.com/docs/checkout/#verification-using-a-client-library).

### Error Codes

The error codes that may be returned in the `errorCallback` method are:

Error Code                         | Description
---------------------------------- | --------------------------------------------------------------------------------------------------------------
PayabbhiCheckout.INVALID_ARGUMENTS | Invalid or missing [Checkout Configuration options](https://payabbhi.com/docs/checkout/#configuration-options)
PayabbhiCheckout.PAYMENT_CANCELED  | User cancelled the payment (e.g., by pressing back button or tapping on the back option).
PayabbhiCheckout.NETWORK_ERROR     | A network-related error occurred (e.g., loss of internet connectivity, connection timeout, etc).

--------------------------------------------------------------------------------

## Recommendation for Android Platform

**_Prerequisite [background reading](https://cordova.apache.org/docs/en/latest/guide/platforms/android/#lifecycle-guide)_**

In Android, the OS can kill activities in the background to free up resources. Payabbhi plugin launches a new activity in Android, which temporarily pushes the Cordova activity to the background. In order to handle the scenario when the Cordova activity may get destroyed by the OS, add the following code snippet to ensure a receipt of payment response as and when cordova activity is recreated after being destroyed:

```
// Register an event listener in the `resume` event
document.addEventListener('resume', onResume, false);
var onResume = function(event) {
        // Pass the event, payment success and error callbacks to PayabbhiCheckout
        PayabbhiCheckout.onResume(event, successCallback, errorCallback);
      };
```

## Tests

To test this plugin with `cordova-plugin-test-framework`, run the following command to install the tests:

```shell
cordova plugin add https://github.com/payabbhi/cordova-plugin-payabbhi#:/tests
```

To see the test coverage, within `config.xml` change `<content src="index.html"/>` with `<content src="cdvtests/index.html"/>`

## Note for Ionic applications

- It is not possible for us to support `ionic serve` at the moment due to the intrinsic design of the ionic framework. Please try `ionic run browser` instead of `ionic serve`, as `ionic serve` may not support cordova plugins for browser at the moment. Reference: [driftyco/ionic-cli#354](https://github.com/driftyco/ionic-cli/issues/354).
