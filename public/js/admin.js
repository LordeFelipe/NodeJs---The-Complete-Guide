const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector('[name=productId]').value
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value

  const productElement = btn.closest('article')


  fetch('/admin/product/' + prodId, { //Método para enviar HTTP requests
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    }
  })
  .then(result => {
    return result.json()

  })
  .then(data => {
    productElement.parentNode.removeChild(productElement)
  })
  .catch(e => console.log(e))
}