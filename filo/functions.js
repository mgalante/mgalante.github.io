async function cargarDatos(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function cargarTemplate(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text;
}

function leerParametro(paramName) {
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}

function montar(template, data, id) {
  const rendered = Mustache.render(template, data);
  document.getElementById(id).innerHTML = rendered;
}

function buscar(lista, param, valor) {
  return lista.find((x) => x[param] === valor);
}
