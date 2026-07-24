import { Header } from "@/modules/business/components/Header"
import { Hero } from "@/modules/business/components/Hero"
import { About } from "@/modules/business/components/About"
import { VisionMission } from "@/modules/business/components/VisionMission"
import { Products } from "@/modules/business/components/Products"
import { Sustainability } from "@/modules/business/components/Sustainability"
import { Industries } from "@/modules/business/components/Industries"
import { FarmJourney } from "@/modules/business/components/FarmJourney"
import { WhyChoose } from "@/modules/business/components/WhyChoose"
import { Motto } from "@/modules/business/components/Motto"
import { CTA } from "@/modules/business/components/CTA"

export default function BusinessPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <VisionMission />
        <Products />
        <Sustainability />
        <Industries />
        <FarmJourney />
        <WhyChoose />
        <Motto />
        <CTA />
      </main>
    </>
  )
}
