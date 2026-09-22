import ExpoModulesCore

final class MessageInputView: ExpoView, UITextFieldDelegate {
  let field = UITextField()
  let onSubmit = EventDispatcher()
  var submissionEnabled = true
  var maxLength = Int.max
  var placeholderColor = UIColor.placeholderText

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    field.delegate = self
    field.returnKeyType = .send
    field.autocorrectionType = .yes
    field.font = .systemFont(ofSize: 17)
    addSubview(field)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    field.frame = bounds
  }

  func submit() {
    guard submissionEnabled else { return }
    // Complete UIKit editing before reading and clearing, in one UI-thread operation.
    // Telegram also moves/restores selection: unmarkText alone does not accept T9.
    field.unmarkText()
    if let selection = field.selectedTextRange {
      let offset = field.offset(from: field.beginningOfDocument, to: selection.start)
      if offset > 0, let previous = field.position(from: selection.start, offset: -1) {
        field.selectedTextRange = field.textRange(from: previous, to: previous)
        field.selectedTextRange = selection
      }
    }
    let text = (field.text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty else { return }
    clear()
    onSubmit(["text": text])
  }

  func clear() {
    field.unmarkText()
    field.text = ""
  }

  func textFieldShouldReturn(_ textField: UITextField) -> Bool {
    submit()
    return false
  }

  func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange,
                 replacementString string: String) -> Bool {
    let length = (textField.text ?? "").utf16.count - range.length + string.utf16.count
    return length <= maxLength
  }
}
