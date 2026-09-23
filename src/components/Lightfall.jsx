import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import './Lightfall.css'

const MAX_COLORS = 8
const hexToRGB = hex => {
  const color = hex.replace('#', '').padEnd(6, '0')
  return [0, 2, 4].map(index => parseInt(color.slice(index, index + 2), 16) / 255)
}
const prepColors = input => {
  const base = (input?.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS)
  const arr = Array.from({ length: MAX_COLORS }, (_, index) => hexToRGB(base[Math.min(index, base.length - 1)]))
  const avg = base.reduce((sum, _, index) => sum.map((value, channel) => value + arr[index][channel]), [0, 0, 0]).map(value => value / base.length)
  return { arr, count: base.length, avg }
}

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position,0.,1.);}
`

const fragment = `
precision highp float;
uniform vec3 iResolution; uniform vec2 iMouse; uniform float iTime;
uniform vec3 uColor0,uColor1,uColor2,uColor3,uColor4,uColor5,uColor6,uColor7;
uniform int uColorCount; uniform vec3 uBgColor,uMouseColor;
uniform float uSpeed,uStreakWidth,uStreakLength,uGlow,uDensity,uTwinkle,uZoom,uBgGlow,uOpacity,uMouseEnabled,uMouseStrength,uMouseRadius;
uniform int uStreakCount; varying vec2 vUv;
vec3 palette(float h){int count=uColorCount;if(count<1)count=1;int i=int(floor(clamp(h,0.,.999999)*float(count)));if(i<=0)return uColor0;if(i==1)return uColor1;if(i==2)return uColor2;if(i==3)return uColor3;if(i==4)return uColor4;if(i==5)return uColor5;if(i==6)return uColor6;return uColor7;}
vec3 tanhv(vec3 x){vec3 e=exp(-2.*x);return(1.-e)/(1.+e);}
vec2 sceneC(vec2 frag,vec2 r){vec2 p=(frag+frag-r)/r.x;float z=0.,d=1e3;vec4 o=vec4(0.);for(int k=0;k<39;k++){if(d<=1e-4)break;o=z*normalize(vec4(p,uZoom,0.))-vec4(0.,4.,1.,0.)/4.5;d=1.-sqrt(length(o*o));z+=d;}return vec2(o.x,atan(o.z,o.y));}
void main(){vec2 r=iResolution.xy,c=vUv*r,uv=(c+c-r)/r.x;float t=.1*iTime*uSpeed+9.;float rings=max(1.,floor(6.2831853*max(uDensity,.05)+.5));vec2 y=vec2(5e-3,6.2831853/rings);vec2 c0=sceneC(c,r),dx=sceneC(c+vec2(1.,0.),r)-c0,dy=sceneC(c+vec2(0.,1.),r)-c0;dx.y-=6.2831853*floor(dx.y/6.2831853+.5);dy.y-=6.2831853*floor(dy.y/6.2831853+.5);vec2 fw=abs(dx)+abs(dy);c=c0;vec2 p=vec2(2.,1.)*uv-(r/r.x)*vec2(0.,1.);vec4 o=vec4(uBgColor*90.*uBgGlow/(1e3*dot(p,p)+6.),0.);float mg=0.;if(uMouseEnabled>.5){vec2 mn=(iMouse+iMouse-r)/r.x;float md=length(uv-mn);mg=exp(-md*md/max(uMouseRadius*uMouseRadius,1e-4))*uMouseStrength;o.rgb+=uMouseColor*mg*.25;}float zr=5e-4*uStreakWidth;vec2 rr=vec2(max(length(fw),1e-5));float tail=19./max(uStreakLength,.05);for(int m=0;m<16;m++){if(m>=uStreakCount)break;float f=float(m)+1.,ic=fract(sin(dot(vec2(f,floor(c.x/y.x+.5)),vec2(7.,11.))*73.));vec2 pp=c-(t+t*ic)*vec2(0.,1.);pp-=floor(pp/y+.5)*y;float h=fract(8663.*ic);float w=mix(1.5,1.+sin(t+7.*h+4.),uTwinkle)*(1.+mg*2.);vec2 inner=vec2(length(max(pp,vec2(-1.,0.))),length(pp)-zr)-zr;vec2 sm=vec2(1.)-smoothstep(-rr,rr,inner);o.rgb+=dot(sm,vec2(exp(tail*pp.y),3.))*palette(h)*w;c.x+=y.x/8.;}vec3 col=sqrt(tanhv(max(o.rgb*uGlow-vec3(.04,.08,.02),0.)));gl_FragColor=vec4(col,uOpacity);}
`

export default function Lightfall({ className = '', colors, backgroundColor = '#0A29FF', speed = .5, streakCount = 2, streakWidth = 1, streakLength = 1, glow = 1, density = .6, twinkle = 1, zoom = 3, backgroundGlow = .5, opacity = 1, mouseInteraction = true, mouseStrength = .5, mouseRadius = 1, mouseDampening = .15, paused = false, dpr = 1 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const renderer = new Renderer({ dpr, alpha: true, antialias: true })
    const gl = renderer.gl
    const canvas = gl.canvas
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' })
    container.appendChild(canvas)
    const { arr, count, avg } = prepColors(colors)
    const uniforms = {
      iResolution: { value: [1, 1, 1] }, iMouse: { value: [0, 0] }, iTime: { value: 0 },
      ...Object.fromEntries(arr.map((value, index) => [`uColor${index}`, { value }])),
      uColorCount: { value: count }, uBgColor: { value: hexToRGB(backgroundColor) }, uMouseColor: { value: avg },
      uSpeed: { value: speed }, uStreakCount: { value: Math.max(1, Math.min(16, Math.round(streakCount))) }, uStreakWidth: { value: streakWidth }, uStreakLength: { value: streakLength }, uGlow: { value: glow }, uDensity: { value: density }, uTwinkle: { value: twinkle }, uZoom: { value: zoom }, uBgGlow: { value: backgroundGlow }, uOpacity: { value: opacity }, uMouseEnabled: { value: mouseInteraction ? 1 : 0 }, uMouseStrength: { value: mouseStrength }, uMouseRadius: { value: mouseRadius }
    }
    const program = new Program(gl, { vertex, fragment, uniforms })
    const geometry = new Triangle(gl)
    const mesh = new Mesh(gl, { geometry, program })
    const mouseTarget = [0, 0]
    let frame, lastTime = 0
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      renderer.setSize(width, height)
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1]
    }
    const move = event => {
      const rect = canvas.getBoundingClientRect()
      mouseTarget[0] = (event.clientX - rect.left) * renderer.dpr
      mouseTarget[1] = (rect.height - event.clientY + rect.top) * renderer.dpr
    }
    const loop = time => {
      frame = requestAnimationFrame(loop)
      const dt = lastTime ? (time - lastTime) / 1000 : 0
      lastTime = time
      uniforms.iTime.value = time * .001
      const factor = mouseDampening > 0 ? 1 - Math.exp(-dt / mouseDampening) : 1
      uniforms.iMouse.value[0] += (mouseTarget[0] - uniforms.iMouse.value[0]) * factor
      uniforms.iMouse.value[1] += (mouseTarget[1] - uniforms.iMouse.value[1]) * factor
      if (!paused) renderer.render({ scene: mesh })
    }
    const observer = new ResizeObserver(resize)
    resize(); observer.observe(container)
    if (mouseInteraction) canvas.addEventListener('pointermove', move)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointermove', move)
      canvas.remove()
      program.remove?.(); geometry.remove?.(); mesh.remove?.(); renderer.destroy?.()
    }
  }, [backgroundColor, backgroundGlow, colors, density, dpr, glow, mouseDampening, mouseInteraction, mouseRadius, mouseStrength, opacity, paused, speed, streakCount, streakLength, streakWidth, twinkle, zoom])

  return <div ref={containerRef} className={`lightfall-container ${className}`} aria-hidden="true" />
}
