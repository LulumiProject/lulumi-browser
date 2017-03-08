const h1 = document.getElementById('lulumi-name');
const h2 = document.getElementById('lulumi-desc');
h1.innerHTML += 'About Lulumi';

// eslint-disable-next-line no-unused-vars
const Process = (function Process() {
  return {
    start(data) {
      let entry;
      data.forEach((list) => {
        entry = document.createElement('li');
        entry.appendChild(document.createTextNode(`${list[0]} : ${list[1]}`));
        h2.appendChild(entry);
      });
    },
  };
}());
