import {
  createReference,
  define,
  html as h,
  type EventHandler,
} from "knyt";

export type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

export const ContactForm = define.element({
  tagName: "knyt-contact-form",
  properties: {
    defaultValue: define.property<ContactFormData>(),
    onChange: define.property<(data: ContactFormData) => void>(),
    onSubmit: define.property<(data: ContactFormData) => void>(),
  },
  lifecycle() {
    const name$ = createReference<HTMLInputElement | null>(null);
    const email$ = createReference<HTMLInputElement | null>(null);
    const message$ = createReference<HTMLTextAreaElement | null>(null);

    this.onPropChange("defaultValue", (defaultValue) => {
      if (name$.value) {
        name$.value.value = defaultValue?.name ?? "";
      }
      if (email$.value) {
        email$.value.value = defaultValue?.email ?? "";
      }
      if (message$.value) {
        message$.value.value = defaultValue?.message ?? "";
      }
    });

    this.defaultValue = {
      name: "",
      email: "",
      message: "",
    };

    this.onChange = (data) => console.info("Change", data);
    this.onSubmit = (data) => console.info("Submit", data);

    function getFormData(form: HTMLFormElement): ContactFormData {
      const formData = new FormData(form);

      return {
        name: formData.get("name")?.toString() ?? "",
        email: formData.get("email")?.toString() ?? "",
        message: formData.get("message")?.toString() ?? "",
      };
    }

    const handleChange: EventHandler.Change<HTMLFormElement> = (event) => {
      const currentTarget = event.currentTarget;

      if (!currentTarget) return;

      this.onChange?.(getFormData(currentTarget));
    };

    const handleSubmit: EventHandler<HTMLFormElement, Event> = (event) => {
      event.preventDefault();

      const currentTarget = event.currentTarget;

      if (!currentTarget) return;

      this.onSubmit?.(getFormData(currentTarget));
    };

    return () =>
      h.form
        .$(
          h.fieldset.$(
            h.label.$("Name:"),
            h.input.type("text").name("name").$ref(name$),
          ),
          h.fieldset.$(
            h.label.$("Email:"),
            h.input.type("email").name("email").$ref(email$),
          ),
          h.fieldset.$(
            h.label.$("Message:"),
            h.textarea.name("message").$ref(message$),
          ),
          h.button.$("Submit").type("submit"),
          h.button.$("Reset").type("reset"),
          h.fragment.$innerHTML("<h1>Form</h1>"),
        )
        .$on("change", handleChange)
        .$on("submit", handleSubmit);
  },
});
