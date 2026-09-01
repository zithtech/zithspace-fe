"use client";

import { App } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import type { NotificationInstance } from "antd/es/notification/interface";

let message: MessageInstance;
let notification: NotificationInstance;
let modal: Omit<ModalStaticFunctions, "warn">;

export default function AntdGlobalProvider() {
  const staticApp = App.useApp();
  message = staticApp.message;
  modal = staticApp.modal;
  notification = staticApp.notification;
  return null;
}

export { message, modal, notification };
