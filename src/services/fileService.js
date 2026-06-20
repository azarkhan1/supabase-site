export const fileService = {
  /**
   * Convert a File object to a Base64 string.
   * @param {File} file 
   * @returns {Promise<string>}
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Validate a file's size and type.
   * Max size is 5MB.
   * @param {File} file 
   * @returns {{ valid: boolean, error?: string }}
   */
  validateFile(file) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: 'حجم فایل نمی‌تواند بیشتر از ۵ مگابایت باشد'
      };
    }
    
    return {
      valid: true
    };
  }
};
