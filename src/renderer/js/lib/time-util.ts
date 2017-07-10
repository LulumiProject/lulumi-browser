const timeUtil = {

  /**
   * Gets current time based on locale of browser.
   * @returns {String} The current locale time.
   */
  getLocaleCurrentTime(): string {
    const date = new Date();
    return date.toLocaleString();
  },

};

export default timeUtil;
