// sujeto <imagen> <mascara.png> — máscara del sujeto principal (personas u objetos) con Vision (foreground instance mask)
import Foundation
import Vision
import CoreImage
import AppKit

let a = CommandLine.arguments
guard a.count >= 3, let img = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else { print("uso: sujeto <imagen> <mascara.png>"); exit(1) }
let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: img)
do { try h.perform([req]) } catch { print("✗ \(error)"); exit(2) }
guard let r = req.results?.first, !r.allInstances.isEmpty else { print("✗ sin sujeto"); exit(3) }
let buf = try r.generateScaledMaskForImage(forInstances: r.allInstances, from: h)
let ci = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
guard let cg = ctx.createCGImage(ci, from: ci.extent) else { exit(4) }
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
print("✓ \(r.allInstances.count) sujeto(s)")
