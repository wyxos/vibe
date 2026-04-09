import { Comment, Fragment, Text, isVNode, type VNode, type VNodeArrayChildren } from 'vue'

export function hasRenderableSlotContent(children: VNodeArrayChildren | unknown): boolean {
  if (!Array.isArray(children)) {
    return false
  }

  for (const child of children) {
    if (Array.isArray(child)) {
      if (hasRenderableSlotContent(child)) {
        return true
      }
      continue
    }

    if (!isVNode(child)) {
      if (typeof child === 'string') {
        if (child.trim().length > 0) {
          return true
        }
        continue
      }

      if (child !== null && child !== undefined && child !== false) {
        return true
      }
      continue
    }

    if (isIgnorableVNode(child)) {
      continue
    }

    return true
  }

  return false
}

function isIgnorableVNode(node: VNode): boolean {
  if (node.type === Comment) {
    return true
  }

  if (node.type === Text) {
    return typeof node.children === 'string' ? node.children.trim().length === 0 : true
  }

  if (node.type === Fragment) {
    return !hasRenderableSlotContent(node.children)
  }

  return false
}
