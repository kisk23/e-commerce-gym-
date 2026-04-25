import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
    
   <div className=" bg-primary p-5 rounded-lg">
     primary
   </div>
   <div className=" bg-secondary p-5 rounded-lg">
     secondary
   </div>
   <div className=" bg-accent p-5 rounded-lg">
     accent
   </div>
   <div className=" bg-beige p-5 rounded-lg">
     beige
   </div>
    
       
      </div>
    </div>
  )
}

export default Hero
