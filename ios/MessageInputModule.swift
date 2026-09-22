import ExpoModulesCore

public class MessageInputModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MessageInput")

    AsyncFunction("submit") { (tag: Int) -> String? in
      guard let view = self.appContext?.findView(withTag: tag, ofType: UIView.self) else {
        return nil
      }
      return TRMessageInputSubmission.submit(view: view)
    }.runOnQueue(.main)
  }
}
