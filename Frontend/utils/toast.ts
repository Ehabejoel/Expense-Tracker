import Toast from 'react-native-toast-message';

export const showSuccessToast = (title: string, message: string) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};

export const showErrorToast = (title: string, message: string) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};

export const showInfoToast = (title: string, message: string) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};
