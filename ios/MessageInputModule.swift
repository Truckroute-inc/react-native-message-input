import ExpoModulesCore

public class MessageInputModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MessageInput")

    View(MessageInputView.self) {
      Events("onSubmit")
      Prop("placeholder") { (view: MessageInputView, value: String) in
        view.field.placeholder = value
      }
      Prop("textColor") { (view: MessageInputView, value: UIColor) in
        view.field.textColor = value
      }
      Prop("placeholderColor") { (view: MessageInputView, value: UIColor) in
        view.placeholderColor = value
      }
      Prop("fontName") { (view: MessageInputView, value: String) in
        view.field.font = UIFont(name: value, size: view.field.font?.pointSize ?? 17)
      }
      Prop("fontSize") { (view: MessageInputView, value: Double) in
        view.field.font = view.field.font?.withSize(value)
      }
      Prop("maxLength") { (view: MessageInputView, value: Int) in
        view.maxLength = value
      }
      Prop("submissionEnabled") { (view: MessageInputView, value: Bool) in
        view.submissionEnabled = value
      }
      AsyncFunction("submit") { (view: MessageInputView) in view.submit() }
      AsyncFunction("clear") { (view: MessageInputView) in view.clear() }
      AsyncFunction("focus") { (view: MessageInputView) in view.field.becomeFirstResponder() }
      OnViewDidUpdateProps { (view: MessageInputView) in
        view.field.attributedPlaceholder = NSAttributedString(
          string: view.field.placeholder ?? "",
          attributes: [.foregroundColor: view.placeholderColor]
        )
      }
    }
  }
}
