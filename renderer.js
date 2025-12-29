const list = document.getElementById('list');

window.clipboardAPI.onHistoryUpdate((history) => {
  list.innerHTML = '';

  history.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;

    li.onclick = () => {
      window.clipboardAPI.pasteItem(text);
    };

    list.appendChild(li);
  });
});
