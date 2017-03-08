const h1 = document.getElementById('about-name');
const h2 = document.getElementById('about-desc');
h1.innerHTML += 'About Pages';

// eslint-disable-next-line no-unused-vars
const Process = (function Process() {
  return {
    start(data) {
      let entry;
      let a;
      data.forEach((list) => {
        entry = document.createElement('li');
        a = document.createElement('a');
        a.appendChild(document.createTextNode(list[0]));
        a.href = list[1];
        entry.appendChild(a);
        h2.appendChild(entry);
      });
    },
  };
}());
