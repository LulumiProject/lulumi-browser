export default (refs, data) => {
  let entry;

  refs.h1.innerHTML = 'About Lulumi';
  data.forEach((list) => {
    entry = document.createElement('li');
    entry.appendChild(document.createTextNode(`${list[0]} : ${list[1]}`));
    refs.h2.appendChild(entry);
  });
};
