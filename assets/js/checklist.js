let body = document.body;
let button = document.querySelector("#btn-nxt");
console.log(button);
body.addEventListener("click", clickHandler); // Global click handler for buttons

function clickHandler(e) {
  if(e.target.type == "checkbox") {
    if(e.target.checked) {
      let button = e.target.parentElement.parentElement.parentNode.querySelector('.accordion-button');
      button.style.backgroundColor = "green";
    } else {
      let button = e.target.parentElement.parentElement.parentNode.querySelector('.accordion-button');
      button.style.backgroundColor = "#6575a4";
    }
    let checked = document.querySelectorAll("input:checked");
    if (checked.length === 10) {
      button.style.display = "initial";
    } else {
      // there are some checked checkboxes
      console.log(checked.length + " checkboxes checked");
    }
  }
}
