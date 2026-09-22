#import "MessageInputSubmission.h"
#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>

typedef UIView<RCTBackedTextInputViewProtocol> TRInputView;

static TRInputView *TRFindInput(UIView *view) {
  if ([view conformsToProtocol:@protocol(RCTBackedTextInputViewProtocol)]) {
    return (TRInputView *)view;
  }
  for (UIView *child in view.subviews) {
    TRInputView *input = TRFindInput(child);
    if (input) return input;
  }
  return nil;
}

@implementation TRMessageInputSubmission

+ (NSString *)submitInView:(UIView *)view {
  NSAssert(NSThread.isMainThread, @"MessageInput must run on the main thread");
  TRInputView *input = TRFindInput(view);
  if (!input) return nil;

  [input unmarkText];
  UITextRange *selection = input.selectedTextRange;
  if (selection && [input offsetFromPosition:input.beginningOfDocument toPosition:selection.start] > 0) {
    UITextPosition *previous = [input positionFromPosition:selection.start offset:-1];
    if (previous) {
      [input setSelectedTextRange:[input textRangeFromPosition:previous toPosition:previous] notifyDelegate:NO];
      [input setSelectedTextRange:selection notifyDelegate:NO];
    }
  }

  NSString *message = [input.attributedText.string
    stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
  if (message.length == 0) return nil;

  id<RCTBackedTextInputDelegate> delegate = input.textInputDelegate;
  input.textInputDelegate = nil;
  @try {
    input.attributedText = [[NSAttributedString alloc] initWithString:@""];
  } @finally {
    input.textInputDelegate = delegate;
  }
  // Advance React Native's state and event count before JS can render an old draft.
  [delegate textInputDidChange];
  [delegate textInputDidChangeSelection];
  return message;
}
@end
