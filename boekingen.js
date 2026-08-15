// https://github.com/dwyl/learn-to-send-email-via-google-script-html-no-server

function getFormData() {
  var form = document.getElementById("gform");
  var elements = form.elements;
  var fields = Object.keys(elements).map(function(k) {
    if(elements[k].name !== undefined) {
      return elements[k].name;
    // special case for Edge's html collection
    } else if(elements[k].length > 0){
      return elements[k].item(0).name;
    }
  }).filter(function(item, pos, self) {
    return self.indexOf(item) == pos && item;
  });
  var data = {};
  fields.forEach(function(k){
    data[k] = elements[k].value;
    var str = ""; // declare empty string outside of loop to allow
                  // it to be appended to for each item in the loop
    if(elements[k].type === "checkbox"){ // special case for Edge's html collection
      if(elements[k].checked){
        str = str + elements[k].value + ", "; // take the string and append
                                              // the current checked value to
                                              // the end of it, along with
                                              // a comma and a space
        data[k] = str.slice(0, -2); // remove the last comma and space
                                  // from the string to make the output
                                  // prettier in the spreadsheet
      }
    } else if(elements[k].length){
      for(var i = 0; i < elements[k].length; i++){
        if(elements[k].item(i).checked){
          str = str + elements[k].item(i).value + ", "; // same as above
          data[k] = str.slice(0, -2);
        }
      }
    }
  });
  // add form-specific values into the data
  data.formDataNameOrder = JSON.stringify(fields);
  data.formGoogleSheetName = form.dataset.sheet || "boekingen"; // default sheet name
  data.formGoogleSendEmail = form.dataset.email || ""; // no email by default
  return data;
}

var formLoadedAt = Date.now();

function handleFormSubmit(event) {  // handles form submit withtout any jquery
  event.preventDefault();           // we are submitting via xhr below
  var data = getFormData();         // get the values submitted in the form

  var shouldNotSubmit = data.website !== '';
  delete data.website;

  if (shouldNotSubmit) {
    return;
  }

  if (Date.now() - formLoadedAt < 2000) {
    return;
  }

  var buttons = event.target.querySelectorAll('button, input[type="submit"]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }

  var url = event.target.action;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  var handled = false;
  function showError() {
    if(handled) {
      return;
    }
    handled = true;
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = false;
    }
    alert('Verzending niet gelukt. Probeer het opnieuw of neem contact met ons op via info@opde1sterij.nl');
  }
  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4 && !handled) {
      try {
        var result = JSON.parse(xhr.responseText);
        if(result.result === 'success') {
          handled = true;
          event.target.reset();
          document.getElementById('boekingsbevestiging').style.display = 'none';
          document.getElementById('boeking-verzonden').style.display = 'inline-block';
        } else {
          showError();
        }
      } catch(error) {
        showError();
      }
    }
  };
  xhr.onerror = showError;
  xhr.ontimeout = showError;
  xhr.timeout = 20000;
  // url encode form data for sending as post data
  var encoded = Object.keys(data).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
  }).join('&')
  xhr.send(encoded);
}
function boekingspaginaGeladen() {
  var form = document.getElementById('gform');
  form.addEventListener("submit", handleFormSubmit, false);
};
document.addEventListener('DOMContentLoaded', boekingspaginaGeladen, false);