import Payabbhi
import UIKit

@objc(PayabbhiCheckout) class PayabbhiCheckout : CDVPlugin, PaymentCallback {
    var storedCallbackId: String!

    @objc(open:)
    func open(command: CDVInvokedUrlCommand) {
        let cdvOptions = command.arguments[0] as? [String:Any] ?? [String:Any]()
        self.storedCallbackId = command.callbackId

        let accessId = cdvOptions["access_id"] as! String

        let p : Payabbhi = Payabbhi(accessID: accessId, delegate: self.viewController, pluginDelegate: self)

        let err = p.open(options: cdvOptions)
        if err != nil {
            let errorMsg: [String:Any] = ["code": err!.getCode(), "message": err!.getMessage()]
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: errorMsg)
            self.commandDelegate.send(pluginResult, callbackId: self.storedCallbackId)
        }
    }

    func onPaymentSuccess(paymentResponse: PaymentResponse) {
        let successMsg: [String: String] = ["payment_id": paymentResponse.getPaymentID(), "order_id": paymentResponse.getOrderID(), "payment_signature": paymentResponse.getPaymentSignature()]

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: successMsg)
        self.commandDelegate.send(pluginResult, callbackId: self.storedCallbackId)
    }

    func onPaymentError(code: Int, message: String) {
        let errorMsg: [String: Any] = ["code": code, "message": message]

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: errorMsg)
        self.commandDelegate.send(pluginResult, callbackId: self.storedCallbackId)
    }

}
