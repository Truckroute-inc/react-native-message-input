#import "MessageInputController.h"
#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>
#import <objc/runtime.h>

static char TRMessageInputControllerKey;

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

@interface TRMessageInputController () <RCTBackedTextInputDelegate>
@property(nonatomic, weak) TRInputView *input;
@property(nonatomic, weak) id<RCTBackedTextInputDelegate> originalDelegate;
@property(nonatomic, copy) NSString *identifier;
@property(nonatomic, copy) void (^onSubmit)(NSString *);
@property(nonatomic) BOOL enabled;
@property(nonatomic) BOOL interceptReturn;
@property(nonatomic) BOOL submitting;
@property(nonatomic) BOOL clearing;
@end

@implementation TRMessageInputController

+ (BOOL)attachToView:(UIView *)view
         identifier:(NSString *)identifier
            enabled:(BOOL)enabled
    interceptReturn:(BOOL)interceptReturn
           onSubmit:(void (^)(NSString *))onSubmit {
  NSAssert(NSThread.isMainThread, @"MessageInput must run on the main thread");
  TRInputView *input = TRFindInput(view);
  if (!input || !input.textInputDelegate) return NO;
  TRMessageInputController *controller = objc_getAssociatedObject(input, &TRMessageInputControllerKey);
  if (!controller) {
    controller = [TRMessageInputController new];
    controller.input = input;
    objc_setAssociatedObject(input, &TRMessageInputControllerKey, controller, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  if (input.textInputDelegate != controller) {
    controller.originalDelegate = input.textInputDelegate;
    input.textInputDelegate = controller;
  }
  controller.identifier = identifier;
  controller.enabled = enabled;
  controller.interceptReturn = interceptReturn;
  controller.onSubmit = onSubmit;
  return YES;
}

+ (void)detachFromView:(UIView *)view identifier:(NSString *)identifier {
  TRInputView *input = TRFindInput(view);
  TRMessageInputController *controller = objc_getAssociatedObject(input, &TRMessageInputControllerKey);
  if (![controller.identifier isEqualToString:identifier]) return;
  if (input.textInputDelegate == controller) input.textInputDelegate = controller.originalDelegate;
  objc_setAssociatedObject(input, &TRMessageInputControllerKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

+ (BOOL)submitInView:(UIView *)view identifier:(NSString *)identifier {
  TRInputView *input = TRFindInput(view);
  TRMessageInputController *controller = objc_getAssociatedObject(input, &TRMessageInputControllerKey);
  if (![controller.identifier isEqualToString:identifier]) return NO;
  [controller submitFromKeyboard:NO];
  return YES;
}

- (void)commitAutocorrection {
  TRInputView *input = self.input;
  [input unmarkText];
  UITextRange *selection = input.selectedTextRange;
  if (selection && [input offsetFromPosition:input.beginningOfDocument toPosition:selection.start] > 0) {
    UITextPosition *previous = [input positionFromPosition:selection.start offset:-1];
    if (previous) {
      [input setSelectedTextRange:[input textRangeFromPosition:previous toPosition:previous] notifyDelegate:NO];
      [input setSelectedTextRange:selection notifyDelegate:NO];
    }
  }
}

- (BOOL)submitFromKeyboard:(BOOL)fromKeyboard {
  if (self.submitting) return YES;
  if (!self.enabled) return fromKeyboard ? [self.originalDelegate textInputShouldSubmitOnReturn] : NO;
  self.submitting = YES;
  @try {
    [self commitAutocorrection];
    // Preserve React Native's onSubmitEditing event and submitBehavior handling.
    if (fromKeyboard && ![self.originalDelegate textInputShouldSubmitOnReturn]) return NO;
    NSString *message = [self.input.attributedText.string
      stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
    if (message.length == 0) return YES;
    self.clearing = YES;
    self.input.attributedText = [[NSAttributedString alloc] initWithString:@""];
    self.clearing = NO;
    // Update RN's native state and event count, so old JS renders cannot restore the draft.
    [self.originalDelegate textInputDidChange];
    [self.originalDelegate textInputDidChangeSelection];
    if (self.onSubmit) self.onSubmit(message);
    return YES;
  } @finally {
    self.clearing = NO;
    self.submitting = NO;
  }
}

- (BOOL)textInputShouldSubmitOnReturn {
  if (!self.interceptReturn) return [self.originalDelegate textInputShouldSubmitOnReturn];
  return [self submitFromKeyboard:YES];
}

- (BOOL)textInputShouldReturn {
  return [self.originalDelegate textInputShouldReturn];
}

- (void)textInputDidChange {
  if (!self.clearing) [self.originalDelegate textInputDidChange];
}

- (void)textInputDidChangeSelection {
  if (!self.clearing) [self.originalDelegate textInputDidChangeSelection];
}

- (BOOL)textInputShouldBeginEditing { return [self.originalDelegate textInputShouldBeginEditing]; }
- (void)textInputDidBeginEditing { [self.originalDelegate textInputDidBeginEditing]; }
- (BOOL)textInputShouldEndEditing { return [self.originalDelegate textInputShouldEndEditing]; }
- (void)textInputDidEndEditing { [self.originalDelegate textInputDidEndEditing]; }
- (void)textInputDidReturn { [self.originalDelegate textInputDidReturn]; }
- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range {
  return [self.originalDelegate textInputShouldChangeText:text inRange:range];
}

// Forward optional and future delegate methods, including multiline scrolling.
- (BOOL)respondsToSelector:(SEL)selector {
  return [super respondsToSelector:selector] || [self.originalDelegate respondsToSelector:selector];
}
- (id)forwardingTargetForSelector:(SEL)selector {
  return [self.originalDelegate respondsToSelector:selector] ? self.originalDelegate : [super forwardingTargetForSelector:selector];
}
@end
