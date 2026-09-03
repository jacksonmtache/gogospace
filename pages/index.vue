<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

useHead({
  title: 'Interior Design AI',
})

const comparePosition = ref(50)
const compareContainer = ref<HTMLElement | null>(null)
const compareContainerWidth = ref(0)
const featureCompareContainer = ref<HTMLElement | null>(null)
const featureCompareWidth = ref(0)
const beforeImage = ref('/images/original.avif')
const afterImage = ref('/images/minimalist.avif')
const testimonialPage = ref(0)
const openFaq = ref(0)
const phraseIndex = ref(0)
const windowWidth = ref(0)
const heroFileInput = ref<HTMLInputElement | null>(null)
const uploadError = ref('')
const uploadingPreview = ref(false)

let isDraggingCompare = false
let testimonialTimer: ReturnType<typeof setInterval> | null = null
let phraseTimer: ReturnType<typeof setInterval> | null = null

const { scrollToSection } = useSiteNavigation()
const { registerUploadTrigger, unregisterUploadTrigger } = useUploadTrigger()
const { begin } = usePreviewSession()

const rotatingPhrases = ['Room Photo', 'Design Sketch', 'Space Photo', 'Concept Sketch']

const howItWorksSteps = [
  {
    title: 'Upload your photo',
    description:
      'Snap or upload a photo of any room — living room, bedroom, kitchen, or even a hand-drawn sketch.',
    image: '/images/howtouse1.avif',
  },
  {
    title: 'Choose your style',
    description:
      'Pick from dozens of curated design styles — Scandinavian, Japandi, industrial, luxury, and more.',
    image: '/images/howtouse2.avif',
  },
  {
    title: 'Get your design',
    description:
      'Our AI generates a photorealistic redesign of your actual space in seconds. Refine and download instantly.',
    image: '/images/howtouse3.avif',
  },
]

const latestDesigns = [
  {
    id: 1,
    image: '/images/minimalist.avif',
    alt: 'Minimalist living room',
    span: 'col-span-1 row-span-1 md:col-span-2 md:row-span-2',
  },
  {
    id: 2,
    image: '/images/howtouse3.avif',
    alt: 'Modern bedroom design',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    alt: 'Scandinavian lounge',
    span: 'col-span-1 row-span-1 md:row-span-2',
  },
  {
    id: 4,
    image: '/images/howtouse2.avif',
    alt: 'Japandi kitchen',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
    alt: 'Industrial loft',
    span: 'col-span-2 row-span-1',
  },
  {
    id: 6,
    image: '/images/original.avif',
    alt: 'Cozy reading nook',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80',
    alt: 'Luxury dining room',
    span: 'col-span-1 row-span-1 md:row-span-2',
  },
  {
    id: 8,
    image: '/images/howtouse1.avif',
    alt: 'Bohemian bedroom',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa0a6a3?w=600&q=80',
    alt: 'Contemporary office',
    span: 'col-span-2 row-span-1',
  },
]

const gogospacePros = [
  'Results in seconds, not weeks',
  'Start for free — no upfront commitment',
  'Try unlimited styles on your actual room',
  'No scheduling or back-and-forth meetings',
  'Perfect for early-stage ideation and mood boards',
  'Your photos stay private and secure',
]

const traditionalCons = [
  'Weeks to months for initial concepts',
  'Typical retainer starts at $2,000–$5,000+',
  'Limited revisions without extra fees',
  'Requires multiple in-person consultations',
  'Hard to visualize before committing to purchases',
  'Availability depends on designer schedule',
]

const faqs = [
  {
    question: 'What kind of photos can I upload?',
    answer:
      'You can upload photos of any interior space — living rooms, bedrooms, kitchens, bathrooms, offices, or even empty units. Hand-drawn sketches and floor plans work too.',
  },
  {
    question: 'How realistic are the AI-generated designs?',
    answer:
      "GoGoSpace uses leading AI image models to produce highly detailed, photorealistic interior visuals that respect your room's existing layout and proportions.",
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. Your uploaded photos and generated designs remain private. We do not use your images to train our AI models.',
  },
  {
    question: 'Can I use the designs for my renovation project?',
    answer:
      'Absolutely. Download your designs and share them with contractors, designers, or family members to guide your renovation decisions.',
  },
  {
    question: 'How is GoGoSpace different from hiring an interior designer?',
    answer:
      'GoGoSpace is ideal for fast, affordable visual exploration. It complements — not replaces — professional designers, giving you a head start before investing in a full design service.',
  },
  {
    question: 'Do I need design experience to use GoGoSpace?',
    answer:
      'Not at all. Simply upload a photo, pick a style, and let the AI do the rest. No design skills or software knowledge required.',
  },
]

const features = [
  {
    title: 'Start with one photo',
    description: 'Upload a room, empty unit, or hand-drawn sketch and start reimagining your space.',
    icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>',
  },
  {
    title: 'A range of design styles',
    description: 'Explore minimalist, Japanese Muji, Scandinavian, industrial, luxury, and more.',
    icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>',
  },
  {
    title: 'Leading AI image models',
    description: 'Create highly realistic, detailed interior-design visuals with leading AI models.',
    icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/></svg>',
  },
  {
    title: 'Keep the original layout',
    description: 'Design around the room structure and proportions already present in your photo.',
    icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/></svg>',
  },
  {
    title: 'Refine every design',
    description: 'Adjust colours, furniture, lighting, and details after the first result.',
    icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>',
  },
  {
    title: 'Your designs stay yours',
    description: 'Your uploads and generated images remain private and are not used to train our AI models.',
    icon: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>',
  },
]

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    initials: 'SC',
    role: 'Homeowner',
    rating: 5,
    text: 'I uploaded a photo of my cluttered living room and got back a stunning Scandinavian design. It looked so real I showed it to my contractor the same day.',
  },
  {
    id: 2,
    name: 'Marcus Webb',
    initials: 'MW',
    role: 'Interior Designer',
    rating: 5,
    text: 'GoGoSpace cut my concept presentation time in half. Clients love seeing their actual space transformed — it closes deals faster than mood boards ever did.',
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    initials: 'ER',
    role: 'Real Estate Agent',
    rating: 5,
    text: 'Virtual staging used to cost hundreds per room. Now I stage empty listings in minutes and buyers can actually envision themselves living there.',
  },
  {
    id: 4,
    name: 'James Okonkwo',
    initials: 'JO',
    role: 'Homeowner',
    rating: 5,
    text: 'We were stuck between modern and mid-century for our bedroom. Seeing both styles on our actual room made the decision effortless. Absolutely worth it.',
  },
  {
    id: 5,
    name: 'Priya Sharma',
    initials: 'PS',
    role: 'Homeowner',
    rating: 5,
    text: 'The AI understood my small apartment layout perfectly. The Japandi style suggestion was spot on — warm, minimal, and totally livable.',
  },
  {
    id: 6,
    name: 'David Kim',
    initials: 'DK',
    role: 'Property Developer',
    rating: 5,
    text: 'We use GoGoSpace to show investors finished interiors before construction wraps. The photorealistic quality is impressive every single time.',
  },
  {
    id: 7,
    name: 'Anna Müller',
    initials: 'AM',
    role: 'Homeowner',
    rating: 4,
    text: 'Renovating our kitchen felt overwhelming until we tried this. Seeing the bohemian style on our actual space gave us the confidence to finally start.',
  },
  {
    id: 8,
    name: 'Tom Bradley',
    initials: 'TB',
    role: 'Interior Designer',
    rating: 5,
    text: 'My favorite tool for early-stage client workshops. We iterate on styles live during meetings — clients are blown away by how fast it works.',
  },
]

const testimonialsPerPage = computed(() => {
  if (windowWidth.value < 640) return 1
  if (windowWidth.value < 1024) return 2
  return 4
})

const testimonialGridClass = computed(() => {
  if (windowWidth.value < 640) return 'grid-cols-1'
  if (windowWidth.value < 1024) return 'grid-cols-2'
  return 'grid-cols-4'
})

const testimonialPages = computed(() => {
  const pages = []
  const perPage = testimonialsPerPage.value
  for (let i = 0; i < testimonials.length; i += perPage) {
    pages.push(testimonials.slice(i, i + perPage))
  }
  return pages
})

function goToTestimonialPage(index: number) {
  testimonialPage.value = index
}

function nextTestimonialPage() {
  testimonialPage.value = (testimonialPage.value + 1) % testimonialPages.value.length
}

function startTestimonialAutoplay() {
  testimonialTimer = setInterval(nextTestimonialPage, 5000)
}

function stopTestimonialAutoplay() {
  if (testimonialTimer) {
    clearInterval(testimonialTimer)
    testimonialTimer = null
  }
}

function startPhraseRotation() {
  phraseTimer = setInterval(() => {
    phraseIndex.value = (phraseIndex.value + 1) % rotatingPhrases.length
  }, 2800)
}

function stopPhraseRotation() {
  if (phraseTimer) {
    clearInterval(phraseTimer)
    phraseTimer = null
  }
}

function triggerHeroUpload() {
  scrollToSection('hero')
  nextTick(() => {
    heroFileInput.value?.click()
  })
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || uploadingPreview.value) return

  uploadError.value = ''
  uploadingPreview.value = true
  try {
    await begin(file)
    await navigateTo('/design')
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Could not read that photo.'
    scrollToSection('hero')
  } finally {
    uploadingPreview.value = false
  }
}

function getPointerX(e: MouseEvent | TouchEvent) {
  if ('touches' in e && e.touches.length) return e.touches[0].clientX
  if ('changedTouches' in e && e.changedTouches.length) return e.changedTouches[0].clientX
  return (e as MouseEvent).clientX
}

function updateComparePosition(clientX: number) {
  if (!compareContainer.value) return
  const rect = compareContainer.value.getBoundingClientRect()
  const x = clientX - rect.left
  comparePosition.value = Math.min(100, Math.max(0, (x / rect.width) * 100))
}

function startDrag() {
  isDraggingCompare = true
}

function onComparePointerDown(e: MouseEvent | TouchEvent) {
  isDraggingCompare = true
  updateComparePosition(getPointerX(e))
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingCompare) return
  updateComparePosition(getPointerX(e))
}

function onPointerUp() {
  isDraggingCompare = false
}

function updateContainerWidth() {
  if (compareContainer.value) {
    compareContainerWidth.value = compareContainer.value.offsetWidth
  }
  if (featureCompareContainer.value) {
    featureCompareWidth.value = featureCompareContainer.value.offsetWidth
  }
}

function onResize() {
  windowWidth.value = window.innerWidth
  updateContainerWidth()
  if (testimonialPage.value >= testimonialPages.value.length) {
    testimonialPage.value = 0
  }
}

onMounted(() => {
  windowWidth.value = window.innerWidth
  registerUploadTrigger(triggerHeroUpload)
  updateContainerWidth()
  startTestimonialAutoplay()
  startPhraseRotation()
  window.addEventListener('resize', onResize)
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchmove', onPointerMove, { passive: false })
  window.addEventListener('touchend', onPointerUp)
})

onUnmounted(() => {
  unregisterUploadTrigger()
  stopTestimonialAutoplay()
  stopPhraseRotation()
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onPointerUp)
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section id="hero" class="hero-gradient relative overflow-hidden pt-16">
      <div class="grain absolute inset-0" />
      <div class="relative mx-auto max-w-5xl px-4 pb-12 pt-10 text-center sm:px-6 sm:pb-16 sm:pt-14 lg:pt-20">
        <h1
          class="animate-fade-up font-display flex flex-nowrap items-center justify-center gap-x-[0.25em] text-[clamp(1.5rem,8vw,1.875rem)] font-semibold leading-tight tracking-tight sm:flex-wrap sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span>Upload a</span>
          <span class="hero-phrase-wrap">
            <Transition name="hero-text" mode="out-in">
              <span :key="phraseIndex" class="text-primary">{{ rotatingPhrases[phraseIndex] }}</span>
            </Transition>
          </span>
        </h1>

        <p class="animate-fade-up delay-100 mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:mt-5 sm:text-xl md:text-2xl">
          Upload a photo, pick a style, and see your room reimagined in seconds.
        </p>

        <div class="animate-fade-up delay-200 mt-8 sm:mt-10">
          <button
            class="upload-btn inline-flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-base font-semibold sm:w-auto sm:px-10 sm:py-4 sm:text-lg disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="uploadingPreview"
            @click="heroFileInput?.click()"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            {{ uploadingPreview ? 'Uploading…' : 'Upload your space' }}
          </button>
          <input
            ref="heroFileInput"
            data-hero-upload
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onFileSelect"
          />
          <p v-if="uploadError" class="mt-3 text-sm text-red-600 sm:text-base">{{ uploadError }}</p>
        </div>

        <div
          class="animate-fade-up delay-300 mt-5 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:mt-6 sm:flex-row sm:gap-6 sm:text-lg md:gap-10"
        >
          <span class="flex items-center gap-2">
            <span>⭐</span>
            <span><strong class="font-semibold text-foreground">4.8</strong> user rating</span>
          </span>
          <span class="hidden h-5 w-px bg-border sm:block" />
          <span class="flex items-center gap-2">
            <span>🏠</span>
            <span><strong class="font-semibold text-foreground">231+</strong> spaces transformed</span>
          </span>
        </div>

        <div class="animate-fade-up delay-300 mx-auto mt-10 max-w-6xl sm:mt-14">
          <div
            ref="compareContainer"
            class="compare-slider aspect-[4/3] bg-muted sm:aspect-[16/10] md:aspect-[16/9]"
            @mousedown.prevent="onComparePointerDown"
            @touchstart.prevent="onComparePointerDown"
          >
            <img
              :src="afterImage"
              alt="AI designed room"
              class="absolute inset-0 h-full w-full object-cover"
              draggable="false"
            />
            <div class="absolute inset-0 overflow-hidden" :style="{ width: comparePosition + '%' }">
              <img
                :src="beforeImage"
                alt="Original room"
                class="h-full object-cover"
                :style="{ width: compareContainerWidth + 'px', maxWidth: 'none' }"
                draggable="false"
              />
            </div>
            <div
              class="compare-handle"
              :style="{ left: comparePosition + '%' }"
              @mousedown.stop.prevent="startDrag"
              @touchstart.stop.prevent="startDrag"
            />
            <div
              class="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-base"
            >
              Original
            </div>
            <div
              class="pointer-events-none absolute bottom-2 right-2 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:bottom-4 sm:right-4 sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-base"
            >
              AI Design
            </div>
          </div>
          <p class="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">Drag the handle to compare before &amp; after</p>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section id="testimonials" class="section-padding mx-auto max-w-7xl px-4 sm:px-6">
      <div class="text-center">
        <h2 class="font-display text-3xl font-semibold sm:text-4xl">Loved by homeowners &amp; designers</h2>
        <p class="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-xl">
          See what our users say about transforming their spaces
        </p>
        <div class="mt-4 flex items-center justify-center gap-1">
          <span v-for="n in 5" :key="n" class="text-2xl text-amber-400">★</span>
          <span class="ml-2 text-lg font-semibold text-foreground">4.8</span>
          <span class="text-lg text-muted-foreground">average rating</span>
        </div>
      </div>

      <div class="relative mt-8 overflow-hidden sm:mt-12">
        <div class="testimonial-track" :style="{ transform: `translateX(-${testimonialPage * 100}%)` }">
          <div
            v-for="(page, pageIndex) in testimonialPages"
            :key="pageIndex"
            class="grid w-full flex-shrink-0 gap-4 sm:gap-5"
            :class="testimonialGridClass"
          >
            <div
              v-for="item in page"
              :key="item.id"
              class="testimonial-card flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
            >
              <div class="flex gap-0.5">
                <span v-for="n in item.rating" :key="n" class="text-lg text-amber-400 sm:text-xl">★</span>
              </div>
              <p class="mt-3 flex-1 text-base leading-relaxed text-foreground sm:mt-4 sm:text-lg">"{{ item.text }}"</p>
              <div class="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
                >
                  {{ item.initials }}
                </div>
                <div>
                  <p class="text-base font-semibold">{{ item.name }}</p>
                  <p class="text-base text-muted-foreground">{{ item.role }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 flex items-center justify-center gap-2">
          <button
            v-for="(_, i) in testimonialPages"
            :key="i"
            class="h-2.5 rounded-full transition-all duration-300"
            :class="i === testimonialPage ? 'w-8 bg-primary' : 'w-2.5 bg-border hover:bg-muted-foreground/40'"
            :aria-label="'Go to testimonial page ' + (i + 1)"
            @click="goToTestimonialPage(i)"
          />
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section-padding border-y border-border bg-muted/30">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl md:text-5xl">Features</h2>
          <p class="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-xl">
            Upload one photo and let GoGoSpace create inspiring interior-design concepts.
          </p>
        </div>

        <div class="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div class="feature-icon-box mb-4 flex h-11 w-11 items-center justify-center rounded-xl sm:mb-5 sm:h-12 sm:w-12" v-html="feature.icon" />
            <h3 class="text-sm font-bold uppercase tracking-wide text-foreground sm:text-base">{{ feature.title }}</h3>
            <p class="mt-2 text-base leading-relaxed text-muted-foreground sm:mt-3 sm:text-lg">{{ feature.description }}</p>
          </div>
        </div>

        <div class="feature-showcase mt-10 p-4 sm:mt-16 sm:p-6 md:p-8 lg:p-10">
          <div class="grid items-start gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr] lg:gap-8">
            <div>
              <p class="mb-3 text-center text-lg font-semibold text-primary">Before ↓</p>
              <div class="overflow-hidden rounded-2xl border border-border">
                <img
                  src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80"
                  alt="Hand-drawn room sketch"
                  class="aspect-[4/3] w-full object-cover grayscale"
                />
              </div>
            </div>

            <div>
              <div ref="featureCompareContainer" class="feature-auto-compare aspect-[4/3] bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80"
                  alt="Empty room before design"
                  class="absolute inset-0 h-full w-full object-cover"
                  draggable="false"
                />
                <div class="reveal-layer">
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80"
                    alt="AI designed room"
                    class="h-full object-cover"
                    :style="{ width: featureCompareWidth + 'px', maxWidth: 'none' }"
                    draggable="false"
                  />
                </div>
                <div class="reveal-handle" />
              </div>
            </div>

            <div>
              <p class="mb-3 text-center text-lg font-semibold text-primary">After ↓</p>
              <div class="overflow-hidden rounded-2xl border border-border">
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
                  alt="Finished interior design"
                  class="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="section-padding">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl md:text-5xl">How it works</h2>
          <p class="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-xl">
            Three simple steps to transform any room into your dream space.
          </p>
        </div>

        <div class="mt-10 grid gap-8 sm:mt-14 md:grid-cols-3">
          <div v-for="(step, i) in howItWorksSteps" :key="step.title" class="text-center">
            <div class="relative overflow-hidden rounded-2xl border border-border shadow-sm">
              <img :src="step.image" :alt="step.title" class="aspect-[4/3] w-full object-cover" />
              <div
                class="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-bold text-white shadow-md sm:left-4 sm:top-4 sm:h-10 sm:w-10 sm:text-lg"
              >
                {{ i + 1 }}
              </div>
            </div>
            <h3 class="mt-5 text-lg font-bold uppercase tracking-wide text-foreground sm:mt-6 sm:text-xl">{{ step.title }}</h3>
            <p class="mt-2 text-base leading-relaxed text-muted-foreground sm:mt-3 sm:text-lg">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- GoGoSpace vs Traditional -->
    <section id="comparison" class="section-padding border-y border-border bg-muted/30">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="mx-auto max-w-xs text-3xl font-bold uppercase leading-tight tracking-wide text-foreground sm:max-w-md sm:text-4xl md:max-w-lg md:text-5xl">
            GoGoSpace vs. Traditional
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-xl">
            See how AI-powered design stacks up against hiring a traditional interior designer.
          </p>
        </div>

        <div class="mt-10 grid gap-5 sm:mt-14 sm:gap-6 lg:grid-cols-2">
          <div class="rounded-2xl border-2 border-primary bg-card p-6 shadow-sm sm:p-8">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-base">
                G
              </div>
              <h3 class="text-xl font-bold text-primary sm:text-2xl">GoGoSpace</h3>
            </div>
            <ul class="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
              <li v-for="pro in gogospacePros" :key="pro" class="flex items-start gap-3 text-base sm:text-lg">
                <span class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">✓</span>
                <span>{{ pro }}</span>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg sm:h-10 sm:w-10 sm:text-xl">🎨</div>
              <h3 class="text-xl font-bold text-foreground sm:text-2xl">Traditional Designer</h3>
            </div>
            <ul class="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
              <li v-for="con in traditionalCons" :key="con" class="flex items-start gap-3 text-base text-muted-foreground sm:text-lg">
                <span class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">✗</span>
                <span>{{ con }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="section-padding">
      <div class="mx-auto max-w-3xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl md:text-5xl">FAQ</h2>
          <p class="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-xl">Everything you need to know about GoGoSpace.</p>
        </div>

        <div class="mt-8 space-y-3 sm:mt-12">
          <div
            v-for="(item, i) in faqs"
            :key="item.question"
            class="faq-item rounded-xl border border-border bg-card"
            :class="{ open: openFaq === i }"
          >
            <button
              class="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:gap-4 sm:px-6 sm:py-5"
              @click="openFaq = openFaq === i ? -1 : i"
            >
              <span class="text-base font-semibold sm:text-lg">{{ item.question }}</span>
              <span
                class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xl font-light text-primary transition-transform duration-300"
                :class="{ 'rotate-45': openFaq === i }"
              >
                +
              </span>
            </button>
            <div class="faq-answer">
              <div>
                <p class="px-4 pb-4 text-base leading-relaxed text-muted-foreground sm:px-6 sm:pb-5 sm:text-lg">
                  {{ item.answer }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Designs -->
    <section id="latest-designs" class="section-padding border-t border-border">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl md:text-5xl">Latest designs</h2>
          <p class="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-xl">
            Fresh interior concepts created by our community this week.
          </p>
        </div>

        <div class="designs-mosaic mt-10 grid auto-rows-[120px] grid-cols-2 gap-3 sm:mt-14 sm:auto-rows-[150px] sm:gap-4 md:grid-cols-4 md:auto-rows-[180px]">
          <div v-for="item in latestDesigns" :key="item.id" class="mosaic-item" :class="item.span">
            <img :src="item.image" :alt="item.alt" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section section-padding">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 class="font-display text-3xl font-semibold text-white sm:text-4xl md:text-5xl">Ready to transform your space?</h2>
        <p class="mt-4 text-base text-white/80 sm:mt-5 sm:text-xl">
          Join thousands of homeowners and designers creating beautiful interiors with AI.
        </p>
        <div class="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
          <button
            class="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-primary transition-opacity hover:opacity-90 sm:px-10 sm:py-4 sm:text-lg disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="uploadingPreview"
            @click="heroFileInput?.click()"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            {{ uploadingPreview ? 'Uploading…' : 'Upload image' }}
          </button>
          <NuxtLink
            to="/unlock"
            class="rounded-xl border-2 border-white/40 px-6 py-3.5 text-center text-base font-medium text-white transition-colors hover:border-white hover:bg-white/10 sm:px-10 sm:py-4 sm:text-lg"
          >
            View pricing
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
