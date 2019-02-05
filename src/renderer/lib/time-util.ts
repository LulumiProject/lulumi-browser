const timeUtil = {

  /**
   * Gets current time based on locale of browser.
   * @returns {String} The current locale time.
   */
  getLocaleCurrentTime(): string {
    const date = new Date();
    return date.toLocaleString();
  },

  /**
   * Gets the time value in milliseconds.
   * @returns {Number} The current time milliseconds.
   */
  getMillisecondsTime(): number {
    return new Date().getTime();
  },
};

export default timeUtil;
