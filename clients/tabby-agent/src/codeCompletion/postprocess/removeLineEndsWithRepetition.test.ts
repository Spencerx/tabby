import { emptyCompletionResultItem } from "../solution";
import { documentContext, inline, assertFilterResult } from "./testUtils";
import { removeLineEndsWithRepetition } from "./removeLineEndsWithRepetition";

describe("postprocess", () => {
  describe("removeLineEndsWithRepetition", () => {
    const filter = removeLineEndsWithRepetition();
    it("should drop one line completion ends with repetition", async () => {
      const context = documentContext`javascript
        let foo = ║
      `;
      const completion = inline`
                  ├foo = foo = foo = foo = foo = foo = foo =┤
      `;
      const expected = emptyCompletionResultItem;
      await assertFilterResult(filter, context, completion, expected);
    });

    it("should remove last line that ends with repetition", async () => {
      const context = documentContext`javascript
        let largeNumber = 1000000
        let veryLargeNumber = ║
      `;
      const completion = inline`
                              ├1000000000
        let superLargeNumber = 1000000000000000000000000000000000000000000000┤
      `;
      const expected = inline`
                              ├1000000000┤
      `;
      await assertFilterResult(filter, context, completion, expected);
    });

    it("should keep repetition less than threshold", async () => {
      const context = documentContext`javascript
        let largeNumber = 1000000
        let veryLargeNumber = ║
      `;
      const completion = inline`
                              ├1000000000000┤
      `;
      const expected = completion;
      await assertFilterResult(filter, context, completion, expected);
    });
  });
});
