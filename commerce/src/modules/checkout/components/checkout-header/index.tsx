export function CheckoutHeader() {
  return (
    <div className="w-full h-[230px] bg-gradient-to-br from-[rgba(33,60,2,0.05)] via-[rgba(223,208,189,0.3)] to-[rgba(205,153,95,0.1)] flex items-center">
      <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-12">
        <div className="flex flex-col gap-4 max-w-[403px]">
          <h1 className="text-[36px] leading-[40px] font-bold text-[#0A0A0A]">
            Checkout
          </h1>
          <p className="text-[16px] leading-[24px] text-[#717182]">
            Complete your order and get fresh produce delivered
          </p>
        </div>
      </div>
    </div>
  )
}