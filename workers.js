const myWorker = new Worker("/worker.js");
const first = document.querySelector("input#number1");
const second = document.querySelector("input#number2");

first.onchange = () => {
  myWorker.postMessage([first.value, second.value]);
  console.log("Message posted to worker");
};

onmessage = (e) => {
  console.log("Worker: Message received from main script");

  const result = e.data[0] * e.data[1];

  if (isNaN(result)) {
    postMessage("Please write two numbers");
  } else {
    const workerResult = "Result: " + result;
    console.log("Worker: Posting message back to main script");
    postMessage(workerResult);
  }
};



// query database

function binarySearch(arr, el, compare_fn) {
    let m = 0;
    let n = arr.length - 1;
    while (m <= n) {
        let k = (n + m) >> 1;
        let cmp = compare_fn(el, arr[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return ~m;
}



// pull full graph 
function reverseHelper(arr, i, j) {
  // Exchange characters
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;

  // Move indices
  i++;
  j--;

  // Base case
  if (i >= j) {
    return;
  }

  reverseHelper(arr, i, j);
}

function reverse(str) {
  if (!str || str.length === 0) return str;

  const arr = str.split('');
  reverseHelper(arr, 0, arr.length - 1);
  return arr.join('');
}

// check input for stupid boris jokes
console.log(reverse("hello")); // "olleh"
