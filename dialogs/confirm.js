import { Logger     } from '../modules/logger.js';
import { FsbOptions } from '../modules/options.js';
import { getI18nMsg, parseDocumentLocation } from '../modules/utilities.js';

class ConfirmDialog {

  constructor() {
    this.className     = this.constructor.name;

    this.INFO          = false;
    this.LOG           = false;
    this.DEBUG         = false;
    this.WARN          = false;

    this.logger        = new Logger();
    this.fsbOptionsApi = new FsbOptions(this.logger);
  }



  log(...info) {
    if (this.LOG) this.logger.log(this.className, ...info);
  }

  logAlways(...info) {
    this.logger.logAlways(this.className, ...info);
  }

  debug(...info) {
    if (this.DEBUG) this.logger.debug(this.className, ...info);
  }

  debugAlways(...info) {
    this.logger.debugAlways(this.className, ...info);
  }

  error(...info) {
    // always log errors
    this.logger.error(this.className, ...info);
  }

  caught(e, ...info) {
    // always log exceptions
    this.logger.error( this.className,
                       msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async run(e) {
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    const thisWindow = await messenger.windows.getCurrent();
    messenger.windows.onRemoved.addListener((windowId) => this.windowRemoved(windowId, thisWindow.id));



    const okButtonLabelMsgId     = "fsbConfirmDialog_okButton.label";
    const cancelButtonLabelMsgId = "fsbConfirmDialog_cancelButton.label";
    const yesButtonLabelMsgId    = "fsbConfirmDialog_yesButton.label";
    const noButtonLabelMsgId     = "fsbConfirmDialog_noButton.label";

    var   buttons_3              = false;
    var   title                  = getI18nMsg("fsbConfirmDialogTitle", "Please Confirm");
    var   titleColor;
    var   titleSize;
    var   titleWeight;
    const messages               = [];
    const msgAligns              = [];
    const msgColors              = [];
    const msgSizes               = [];
    const msgWeights             = [];

    var   button1LabelMsgId      = okButtonLabelMsgId;
    var   button2LabelMsgId      = cancelButtonLabelMsgId;
    var   button3LabelMsgId

    var   button1LabelText;
    var   button2LabelText;
    var   button3LabelText;

    const docLocationInfo = parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    if (params) {
      var   param;
      var   msgCount = 6;

      param = params.get('title');
      if (param) title = param;

      param = params.get('tc');
      if (param) titleColor = param;

      param = params.get('ts');
      if (param) titleSize = param;

      param = params.get('tw');
      if (param) titleWeight = param;

      param = params.get('c');
      if (param) {
        const num = Number(param);
        if (Number.isInteger(num)) {
          msgCount = num;
        }
      }

      for (var i = 1; i <= msgCount; ++i) {
        param = params.get(`message${i}`);
        if (param) messages[i] = param;

        param = params.get(`a${i}`);
        if (param) msgAligns[i] = param;
        if (param) msgSizes[i] = param;

        param = params.get(`c${i}`);
        if (param) msgColors[i] = param;

        param = params.get(`s${i}`);

        param = params.get(`w${i}`);
        if (param) msgWeights[i] = param;
      }

      param = params.get('yes_no');
      if (param && param === 'true') {
        buttons_3         = false; // buttons_3 and yes_no_cancel override this
        button1LabelMsgId = yesButtonLabelMsgId;
        button2LabelMsgId = noButtonLabelMsgId;
      }

      param = params.get('yes_no_cancel');
      if (param && param === 'true') {
        buttons_3         = true;
        button1LabelMsgId = yesButtonLabelMsgId;
        button2LabelMsgId = noButtonLabelMsgId;
        button3LabelMsgId = cancelButtonLabelMsgId;
      }

      param = params.get('buttons_3');
      if (param && param === 'true') buttons_3 = true;

      // buttonX and buttonXMsgId override all presents

      param = params.get('button1'); // button1 overrides button1MsgId
      if (param) button1LabelText = param;

      param = params.get('button1MsgId');
      if (param) button1LabelMsgId = param;

      param = params.get('button2'); // button2 overrides button2MsgId
      if (param) button2LabelText = param;

      param = params.get('button2MsgId');
      if (param) button2LabelMsgId = param;

      // button3 and button3Msg are ignored if no buttons_3 or yes_no_cancel
      param = params.get('button3'); // button3 overrides button3MsgId
      if (param) button3LabelText = param;

      param = params.get('button3MsgId');
      if (param) button3LabelMsgId = param;
    }

    if (! button1LabelText && button1LabelMsgId) button1LabelText = getI18nMsg(button1LabelMsgId, "BUTTON_1"); // button1 overrides button1MsgId
    if (! button2LabelText && button2LabelMsgId) button2LabelText = getI18nMsg(button2LabelMsgId, "BUTTON_2"); // button2 overrides button2MsgId
    if (! button3LabelText && button3LabelMsgId) button3LabelText = getI18nMsg(button3LabelMsgId, "BUTTON_3"); // button3 overrides button3MsgId

    if (! button2LabelText) button1LabelText = "BUTTON_1";
    if (! button2LabelText) button2LabelText = "BUTTON_2";
    if (! button3LabelText) button3LabelText = "BUTTON_3";

    const titleLabel = document.getElementById("ConfirmDialogTitleLabel");
    titleLabel.innerText = title;

    if (titleColor)  titleLabel.style.color      = titleColor;
    if (titleSize)   titleLabel.style.fontSize   = titleSize;
    if (titleWeight) titleLabel.style.fontWeight = titleWeight;

    this.debug( "--"
                + `\n- title="${title}"`
                + `\n- msgCount="${msgCount}"`
                + `\n- messages[0]="${messages[0]}"`
                + `\n- messages[1]="${messages[1]}"`
                + `\n- messages[2]="${messages[2]}"`
                + `\n- messages[3]="${messages[3]}"`
                + `\n- messages[4]="${messages[4]}"`
                + `\n- messages[5]="${messages[5]}"`
                + `\n- buttons_3=${buttons_3}`
                + `\n- button1LabelText="${button1LabelText}"`
                + `\n- button2LabelText="${button2LabelText}"`
                + `\n- button3LabelText="${button3LabelText}"`
              );


    const messagesPanel = document.getElementById("ConfirmDialogMessagesPanel");

    if (messages.length < 1) {
      messagesPanel.style.display = "none";

    } else {
      for (var i = 1; i <= msgCount; ++i) {
        const msg    = messages[i];
        const align  = msgAligns[i];
        const color  = msgColors[i];
        const size   = msgSizes[i];
        const weight = msgWeights[i];

        if (msg !== undefined) {
          const messageDiv = document.createElement('div');
            messageDiv.classList.add('confirm-dialog-message');

            if (align)  messageDiv.style.textAlign  = align;
            if (color)  messageDiv.style.color      = color;
            if (size)   messageDiv.style.fontSize   = size;
            if (weight) messageDiv.style.fontWeight = weight;

            const messageLabel = document.createElement('label');
              if (msg === " ") messageLabel.innerHTML = "&nbsp;";
              else             messageLabel.innerText = msg;
            messageDiv.appendChild(messageLabel);
          messagesPanel.appendChild(messageDiv);
        }
      }

      messagesPanel.style.display = "block";
    }

    const button1Label = document.getElementById("ConfirmDialogButton1Label");
    button1Label.textContent = button1LabelText;

    const button2Label = document.getElementById("ConfirmDialogButton2Label");
    button2Label.textContent = button2LabelText;

    if (buttons_3) {
      const button3Label = document.getElementById("ConfirmDialogButton3Label");
      button3Label.textContent = button3LabelText;
    }

    const button1 = document.getElementById("ConfirmDialogButton1");
    button1.addEventListener( "click", (e) => this.buttonClicked(e) );

    const button2 = document.getElementById("ConfirmDialogButton2");
    button2.addEventListener( "click", (e) => this.buttonClicked(e) );

    const button3 = document.getElementById("ConfirmDialogButton3");
    if (buttons_3) {
      button3.style.display = "inline-block";
      button3.addEventListener( "click", (e) => this.buttonClicked(e) );
    } else {
      button3.style.display = "none";
    }

    await this.localizePage();
  }



  async localizePage() {
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "--- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                    );

    await this.fsbOptionsApi.storeWindowBounds("confirmDialogWindowBounds", window);

    if (this.DEBUG) {
      const bounds = await this.fsbOptionsApi.getWindowBounds("confirmDialogWindowBounds");

      if (! bounds) {
        this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Backup Manager Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Backup Manager Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
      } else {
        this.debugAlways( "--- Retrieve Stored Window Bounds ---"
                          + `\n- bounds.top:    ${bounds.top}`
                          + `\n- bounds.left:   ${bounds.left}`
                          + `\n- bounds.width:  ${bounds.width}`
                          + `\n- bounds.height: ${bounds.height}`
                        );
      }
    }
    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async windowRemoved(windowId, thisWindowId) {
    this.debug(`-- windowId="${windowId}" thisWindowId="${thisWindowId}" `);


    if (true) { // <==========================================================================================<<<
      // sending the message causes the "'Conduits' destroyed" error mentioned below.
      // they'll just have to listen for the onRemoved() event.
    } else {
      const responseMessage = "CLOSED";
      this.debug(`-- Sending responseMessage="${responseMessage}"`);

      try { // just in case the window is not listening for windowRemoved (any more)
        // maybe not the best idea to do this... message receiver gets:
        //     Promise rejected after context unloaded: Actor 'Conduits' destroyed before query 'RuntimeMessage' was resolved
        await messenger.runtime.sendMessage(
          { ConfirmDialogResponse: responseMessage }
        );
      } catch (error) {
        // any need to tell the user???
        this.caught( error,
                     "##### SEND RESPONSE MESSAGE FAILED #####"
                     + `\n- windowId="${windowId}"`
                     + `\n- thisWindowId="${thisWindowId}"`
                     + `\n- responseMessage="${responseMessage}"`
                   );
      }
    }
  }




  async buttonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}" e.target.id="${e.target.id}"`);

    e.preventDefault();

    var target = e.target;
    if (target.tagName === 'LABEL' && target.parentElement && target.parentElement.tagName === 'BUTTON') {
      target = target.parentElement;
    }
    this.debug(`-- target.tagName="${target.tagName}" target.id="${target.id}" button-id="${target.getAttribute('button-id')}"`);

      // it's up to the caller what the button-id -- 'BUTTON_1', 'BUTTON_2', or 'BUTTON_3' -- means
    var responseMessage = target.getAttribute('button-id');
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { ConfirmDialogResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("-- Closing window");
    window.close();
  }
}



const confirmDialog = new ConfirmDialog();

document.addEventListener("DOMContentLoaded", (e) => confirmDialog.run(e), {once: true});
