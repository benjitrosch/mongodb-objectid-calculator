//// OBJECTID UTILITIES 

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/
const OBJECT_ID_FORMAT = /^ObjectId\(("|')([0-9a-fA-F]{24})\1\)$/
const OBJECT_ID_LENGTH = 24

type ObjectIdParseResult = [Date, string, string]
type ObjectIdParseErrors = { errors: string[] }

function parseObjectIdInput(input: string): ObjectIdParseResult | ObjectIdParseErrors {
  const errors: string[] = []

  const match = OBJECT_ID_FORMAT.exec(input)
  const id = match ? match[2] : input

  if (!id) {
    errors.push('ObjectId cannot be read')
  }

  if (id.length > OBJECT_ID_LENGTH) {
    errors.push('ObjectId length too long')
  }

  if (id.length < OBJECT_ID_LENGTH) {
    errors.push('ObjectId length too short')
  }

  if (!id.match(OBJECT_ID_PATTERN)) {
    errors.push('ObjectId does not match expected pattern')
  }

  const date = new Date(parseInt(id.substring(0, 8), 16) * 1000)
  const now = new Date()
  const beginning = new Date('1970-01-01T00:00:00Z')

  if (date > now || date < beginning) {
    errors.push('ObjectId timestamp is out of range')
  }

  if (errors.length > 0) {
    return { errors }
  }

  const random = id.slice(8, 18)
  const count = id.slice(18, 24)

  return [date, random, count]
}

function isObjectIdParseResult(result: any): result is ObjectIdParseResult {
  const isTuple = Array.isArray(result) && result.length === 3
  const hasDate = result[0] instanceof Date
  const hasRandom = typeof result[1] === 'string'
  const hasCount = typeof result[2] === 'string'

  return isTuple && hasDate && hasRandom && hasCount
}

function isObjectIdParseErrors(result: any): result is ObjectIdParseErrors {
  const isObject = typeof result === 'object'
  const hasError = 'errors' in result
  const hasArray = Array.isArray(result.errors)

  return isObject && hasError && hasArray
}

function dateToObjectId(date: Date): string {
  const id = "0000000000000000"
  const time = Math.floor(date.getTime() / 1000).toString(16)

  return time + id
}

function valuesToObjectId(date: Date, random: string, count: number): string {
  const dateHex = Math.floor(date.getTime() / 1000).toString(16).padStart(8, '0')
  const randomHex = random
  const countHex = count.toString(16).padStart(6, '0')

  return dateHex + randomHex + countHex
}

//// DOM MANIPULATION 

const DISALLOWED_KEYS = ['Enter', ' ']

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const objectIdInput = document.getElementById("object-id-input") as HTMLTextAreaElement
const validObjectId = document.getElementById("valid-object-id") as HTMLSpanElement
const errorLog = document.getElementById("error-log") as HTMLDivElement
const dateInput = document.getElementById("date-input") as HTMLInputElement
const randomInput = document.getElementById("random-input") as HTMLInputElement
const countInput = document.getElementById("count-input") as HTMLInputElement
const copyButton = document.getElementById("copy-button") as HTMLButtonElement

assert(!!objectIdInput, 'Could not find ObjectIdInput textarea element')
assert(!!validObjectId, 'Could not find ValidObjectId span element')
assert(!!errorLog, 'Could not find errorLog div element')
assert(!!dateInput, 'Could not find dateInput input element')
assert(!!randomInput, 'Could not find randomInput input element')
assert(!!countInput, 'Could not find countInput input element')
assert(!!copyButton, 'Could not find copyButton button element')

function resetFields() {
  validObjectId.style.display = 'none'
  errorLog.style.display = 'none'
  errorLog.innerHTML = ''

  copyButton.disabled = true
}

objectIdInput.addEventListener('keydown', function(e) {
  if (DISALLOWED_KEYS.includes(e.key)) {
    e.preventDefault()
  }
})

objectIdInput.addEventListener('input', function(_) {
  resetFields()

  if (objectIdInput.value.length < 1) {
    return
  }

  const result = parseObjectIdInput(objectIdInput.value)

  if (isObjectIdParseResult(result)) {
    const [date, random, count] = result

    validObjectId.style.display = 'block'
    copyButton.disabled = false

    dateInput.value = date.toISOString()
    randomInput.value = random
    countInput.value = count

    dateInput.style.webkitAnimation = 'none'
    randomInput.style.webkitAnimation = 'none'
    countInput.style.webkitAnimation = 'none'

    setTimeout(function() {
      dateInput.style.webkitAnimation = ''
      randomInput.style.webkitAnimation = ''
      countInput.style.webkitAnimation = ''

      dateInput.style.animationPlayState = 'running'
      randomInput.style.animationPlayState = 'running'
      countInput.style.animationPlayState = 'running'
    }, 10)
  } else if (isObjectIdParseErrors(result)) {
    errorLog.style.display = 'block'
    errorLog.innerHTML += 'Errors:'
    result.errors.forEach((error) => errorLog.innerHTML += `\n\t${error}`)
  }
})

const inputs = [dateInput, randomInput, countInput]

inputs.forEach((input) => {
  input.addEventListener('input', function(_) {
    if (input.value.length < 1) {
      return
    }

    const date = new Date(dateInput.value)
    const random = randomInput.value
    const count = parseInt(countInput.value)

    const objectId = valuesToObjectId(date, random, count)
    updateObjectIdInput(objectId)

    objectIdInput.style.webkitAnimation = 'none'

    setTimeout(function() {
      objectIdInput.style.webkitAnimation = ''
      objectIdInput.style.animationPlayState = 'running'
    }, 10)
  })
})

copyButton.addEventListener('click', function(_) {
  dateInput.select()
  dateInput.setSelectionRange(0, 99999)

  navigator.clipboard.writeText(dateInput.value)

  copyButton.focus()
  copyButton.innerText = "Copied to clipboard"

  setTimeout(function() {
    copyButton.innerText = "Copy timestamp"
  }, 2000)
})

function updateObjectIdInput(value: string) {
  const event = new Event('input', { bubbles: true })

  objectIdInput.value = value
  objectIdInput.dispatchEvent(event)
}

//// STARTUP

function init() {
  const date = new Date()
  const objectId = dateToObjectId(date)

  updateObjectIdInput(objectId)
}

init()

