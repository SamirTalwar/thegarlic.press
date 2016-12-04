var garlicButton = document.createElement('button')
garlicButton.style.position = 'absolute'
garlicButton.style.top = '50px'
garlicButton.style.left = '500px'
garlicButton.style.width = '200px'
garlicButton.style.height = '200px'
garlicButton.style.background = 'green'
garlicButton.style.zIndex = 10
garlicButton.innerHTML = 'Garlic'
garlicButton.onclick = function () {
  window.open('https://thegarlic.press/' + window.location.search.replace('?v=', ''), '_blank')
  garlicButton.style.display = 'none'
  return false
}
console.log(garlicButton)
document.body.append(garlicButton)
