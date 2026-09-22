#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface TRMessageInputController : NSObject
+ (BOOL)attachToView:(UIView *)view
         identifier:(NSString *)identifier
            enabled:(BOOL)enabled
    interceptReturn:(BOOL)interceptReturn
           onSubmit:(void (^)(NSString *))onSubmit
    NS_SWIFT_NAME(attach(view:identifier:enabled:interceptReturn:onSubmit:));
+ (void)detachFromView:(UIView *)view identifier:(NSString *)identifier
    NS_SWIFT_NAME(detach(view:identifier:));
+ (BOOL)submitInView:(UIView *)view identifier:(NSString *)identifier
    NS_SWIFT_NAME(submit(view:identifier:));
@end

NS_ASSUME_NONNULL_END
