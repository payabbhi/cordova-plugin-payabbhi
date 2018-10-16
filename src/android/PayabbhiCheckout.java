package com.payabbhi.cordova;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.payabbhi.CheckoutActivity;
import com.payabbhi.Payabbhi;
import com.payabbhi.PaymentCallback;
import com.payabbhi.PaymentResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import static android.app.Activity.RESULT_OK;

public class PayabbhiCheckout extends CordovaPlugin {

    private CallbackContext cc;
    private static final int CDV_REQUEST_CODE = 55555;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.cc = callbackContext;

        if (!action.equals("open")) {
            return false;
        }
        Activity activity = this.cordova.getActivity();
        JSONObject options = args.getJSONObject(0);
        Intent intent = new Intent(activity, CheckoutActivity.class);
        intent.putExtra("OPTIONS", options.toString());
        this.cordova.setActivityResultCallback(this);
        activity.startActivityForResult(intent, CDV_REQUEST_CODE);

        return true;
    }


    @Override
    public void onRestoreStateForActivityResult(Bundle state, CallbackContext callbackContext) {
        super.onRestoreStateForActivityResult(state, callbackContext);
        if (state != null) {
            this.cc = callbackContext;
        }
    }

    @Override
    public Bundle onSaveInstanceState() {
        return new Bundle();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == CDV_REQUEST_CODE && resultCode == RESULT_OK) {
              Payabbhi.handleCheckoutActivity(intent, new PaymentCallback() {
                  @Override
                  public void onPaymentSuccess(PaymentResponse paymentResponse) {
                      JSONObject response = new JSONObject();
                      try {
                          response.put("order_id", paymentResponse.getOrderID());
                          response.put("payment_id", paymentResponse.getPaymentID());
                          response.put("payment_signature", paymentResponse.getPaymentSignature());
                      } catch (JSONException e) {
                          e.printStackTrace();
                      }
                      cc.success(response);
                  }

                  @Override
                  public void onPaymentError(int code, String message) {
                      JSONObject response = new JSONObject();
                      try {
                          response.put("code", code);
                          response.put("message", message);
                      } catch (JSONException e) {
                          e.printStackTrace();
                      }
                      cc.error(response);
                  }
              });
        }
    }
}
