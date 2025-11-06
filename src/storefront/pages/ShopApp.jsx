import React from "react";
import { Provider } from "react-redux";
import { store } from "../../store";
import ShopRoutes from "../routes/ShopRoutes";

function ShopApp() {
  return (
    <Provider store={store}>
      <ShopRoutes />
    </Provider>
  );
}

export default ShopApp;
