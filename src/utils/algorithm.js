/**
 * Created by Color on 2016/7/6.
 */
const algorithm = {
  shuffle: function (arr) {
    const array = arr;
    let maxIndex = arr.length - 1;
    while (maxIndex > 0) {
      const randIndex = Math.floor(Math.random() * (maxIndex + 1));
      const t = arr[maxIndex];
      array[maxIndex] = arr[randIndex];
      array[randIndex] = t;
      maxIndex--;
    }
  }
}


/* eslint no-extend-native: "off" */
Array.prototype.contains = function (e) {
  for (let i = 0; i < this.length; i++) {
    if (this[i] === e) {
      return true;
    }
  }
  return false;
};

Array.prototype.remove = function (e) {
  for (let i = 0; i < this.length; i++) {
    if (this[i] === e) {
      this.splice(i, 1);
      return true;
    }
  }
  return false;
};

Array.prototype.removeFilter = function (match) {
  for (let i = 0; i < this.length; i++) {
    if (match(this[i])) {
      this.splice(i, 1);
      return true;
    }
  }
  return false;
};

Array.prototype.filterCount = function (match) {
  let sum = 0;
  for (let i = 0; i < this.length; i++) {
    if (match(this[i])) {
      sum++;
    }
  }
  return sum;
};

Array.prototype.all = function (match) {
  for (let i = 0; i < this.length; i++) {
    if (!match(this[i])) {
      return false;
    }
  }
  return true;
};
// https://juejin.cn/post/6844903903071322119
export function accMul(arg1, arg2) {
  let m = 0,
    s1 = arg1.toString(),
    s2 = arg2.toString();
  try {
    m += s1.split(".")[1].length;
  } catch (e) {}
  try {
    m += s2.split(".")[1].length;
  } catch (e) {}
  return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
}

export function accAdd(num1, num2) {
  const num1Digits = (num1.toString().split('.')[1] || '').length;
  const num2Digits = (num2.toString().split('.')[1] || '').length;
  const baseNum = Math.pow(10, Math.max(num1Digits, num2Digits));
  return (num1 * baseNum + num2 * baseNum) / baseNum;
}

export default algorithm;

