"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AspectRatioSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  const ratios = [
    { value: "16:9", label: "16:9 (横屏)" },
    { value: "4:3", label: "4:3 (标准)" },
    { value: "1:1", label: "1:1 (正方形)" },
    { value: "9:16", label: "9:16 (竖屏)" },
  ]

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white border-gray-300 text-black font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {ratios.map((ratio) => (
            <SelectItem key={ratio.value} value={ratio.value} className="text-black hover:bg-gray-100">
              {ratio.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
