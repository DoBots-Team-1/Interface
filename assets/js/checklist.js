let body = document.body;
let button = document.querySelector("#btn-nxt");
console.log(button);
body.addEventListener("click", clickHandler); // Global click handler for buttons

function clickHandler(e) {
  let checked = document.querySelectorAll("input:checked");

  if (checked.length === 10) {
    button.style.display = "initial";
  } else {
    // there are some checked checkboxes
    console.log(checked.length + " checkboxes checked");
  }
}
