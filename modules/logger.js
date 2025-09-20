import { getExtensionId } from '../utilities.js';

export class Logger {
  /* one day I hope to use options to set the logging levels */

  constructor(useManifestId, extId) {
    this.TRACE_DEBUG = false; // MABXXX should be in Options -- most times the trace is not all that useful
    this.TRACE_ERROR = false; // MABXXX should be in Options -- most times the trace is not all that useful

    this.extId = extId;

    if (typeof useManifestId !== 'boolean') useManifestId = true;
    if (useManifestId) this.extId = getExtensionId(extId);
    
    this.extId = this.extId ? this.extId : '';
  }

  info(...info) { /* MABXXX eventually there should be an option for this */
    console.info(this.getTag(), ...info);
  }

  infoAlways(...info) {
    console.info(this.getTag(), ...info);
  }

  log(...info) { /* MABXXX eventually there should be an option for this */
    console.log(this.getTag(), ...info);
  }

  logAlways(...info) {
    console.log(this.getTag(), ...info);
  }

  debug(...info) { /* MABXXX eventually there should be an option for this */
    console.debug(this.getTag(), ...info);
    if (this.TRACE_DEBUG) console.trace();
  }

  debugAlways(...info) {
    console.debug(this.getTag(), ...info);
    if (this.TRACE_DEBUG) console.trace();
  }

  warn(...info) { /* MABXXX eventually there should be an option for this */
    console.warn(this.getTag(), ...info);
  }

  warnAlways(...info) {
    console.warn(this.getTag(), ...info);
  }

  error(...info) { /* ALWAYS get logged */
    console.error(this.getTag(), ...info);
    if (this.TRACE_ERROR) console.trace();
  }

  getTag() {
    return this.extId + ': ';
  }
}
