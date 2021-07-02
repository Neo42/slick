import GSAP from 'gsap'
import normalizeWheel from 'normalize-wheel'
import Prefix from 'prefix'
import Component from './Component'
import {
  TitleAnimation,
  ParagraphAnimation,
  LabelAnimation,
  HighlightAnimation,
} from 'animations'
import {checkMissingArgs, checkIsPlainObject} from 'utils'

export class Page extends Component {
  constructor({root, targets, id}) {
    checkMissingArgs({root, targets, id})
    checkIsPlainObject(targets)

    super({
      root,
      targets: {
        ...targets,
        animatedHighlights: '[data-animation="highlight"]',
        animatedLabels: '[data-animation="label"]',
        animatedParagraphs: '[data-animation="paragraph"]',
        animatedTitles: '[data-animation="title"]',
      },
    })

    this.id = id
    this.transformPrefix = Prefix('transform')
    this.onMouseWheel = this.onMouseWheel.bind(this)
  }

  create() {
    super.create()
    this.scroll = {
      current: 0,
      target: 0,
      last: 0,
      limit: 0,
    }
    this.createAnimations()
  }

  createAnimations() {
    if (
      !this.targetElements.animatedHighlights &&
      !this.targetElements.animatedLabels &&
      !this.targetElements.animatedParagraphs &&
      !this.targetElements.animatedTitles
    )
      return

    if (this.targetElements.animatedHighlights) {
      this.animatedHighlights = Object.values(
        this.targetElements.animatedHighlights,
      ).map((highlight) => new HighlightAnimation({root: highlight}))
    }

    if (this.targetElements.animatedLabels) {
      this.animatedLabels = Object.values(
        this.targetElements.animatedLabels,
      ).map((label) => new LabelAnimation({root: label}))
    }

    if (this.targetElements.animatedParagraphs) {
      this.animatedParagraphs = Object.values(
        this.targetElements.animatedParagraphs,
      ).map((paragraph) => new ParagraphAnimation({root: paragraph}))
    }

    if (this.targetElements.animatedTitles) {
      this.animatedTitles = Object.values(
        this.targetElements.animatedTitles,
      ).map((title) => new TitleAnimation({root: title}))
    }

    this.animations = [
      ...this.animatedHighlights,
      ...this.animatedLabels,
      ...this.animatedParagraphs,
      ...this.animatedTitles,
    ]
  }

  show() {
    return new Promise((resolve) => {
      this.animationIn = GSAP.timeline()

      this.animationIn.fromTo(
        this.rootElement,
        {
          autoAlpha: 0,
        },
        {
          autoAlpha: 1,
        },
      )

      this.animationIn.call(() => {
        this.addEventListeners()
        resolve()
      })
    })
  }

  hide() {
    return new Promise((resolve) => {
      this.removeEventListeners()

      this.animationOut = GSAP.timeline()

      this.animationOut.to(this.rootElement, {
        autoAlpha: 0,
        onComplete: resolve,
      })
    })
  }

  onMouseWheel(event) {
    const {pixelY: normalizedY} = normalizeWheel(event)
    this.scroll.target += normalizedY
  }

  onResize() {
    if (!this.targetElements.wrapper) return

    this.scroll.limit =
      this.targetElements.wrapper.clientHeight - window.innerHeight

    this.animations.forEach((animation) => {
      animation.onResize && animation.onResize()
    })
  }

  addEventListeners() {
    window.addEventListener('mousewheel', this.onMouseWheel)
  }

  removeEventListeners() {
    window.removeEventListener('mousewheel', this.onMouseWheel)
  }

  update() {
    if (!this.targetElements.wrapper) return

    this.scroll.target = GSAP.utils.clamp(
      0,
      this.scroll.limit,
      this.scroll.target,
    )

    this.scroll.current = GSAP.utils.interpolate(
      this.scroll.current,
      this.scroll.target,
      0.1,
    )

    this.scroll.current = this.scroll.current < 0.01 ? 0 : this.scroll.current

    this.targetElements.wrapper.style[
      this.transformPrefix
    ] = `translateY(-${this.scroll.current}px)`
  }
}
