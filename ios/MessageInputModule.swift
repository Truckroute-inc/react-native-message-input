import ExpoModulesCore

public class MessageInputModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MessageInput")
    Events("onSubmit")

    AsyncFunction("attach") { (tag: Int, identifier: String, enabled: Bool, interceptReturn: Bool) -> Bool in
      guard let view = self.appContext?.findView(withTag: tag, ofType: UIView.self) else {
        return false
      }
      return TRMessageInputController.attach(
        view: view, identifier: identifier, enabled: enabled, interceptReturn: interceptReturn
      ) { [weak self] text in
        self?.sendEvent("onSubmit", ["identifier": identifier, "text": text])
      }
    }.runOnQueue(.main)

    AsyncFunction("detach") { (tag: Int, identifier: String) in
      guard let view = self.appContext?.findView(withTag: tag, ofType: UIView.self) else { return }
      TRMessageInputController.detach(view: view, identifier: identifier)
    }.runOnQueue(.main)

    AsyncFunction("submit") { (tag: Int, identifier: String) in
      guard let view = self.appContext?.findView(withTag: tag, ofType: UIView.self),
        TRMessageInputController.submit(view: view, identifier: identifier) else {
        throw Exception(name: "MessageInputUnavailable", description: "MessageInput is no longer mounted.")
      }
    }.runOnQueue(.main)
  }
}
