import { Plus, Trash2 } from 'lucide-react';
import { createEmptyExample } from '../utils/cardContentUtils';

const CardContentFields = ({
  value,
  onChange,
  idPrefix,
  errors = {},
  advancedDefaultOpen = false,
  mode = 'create',
}) => {
  const updateField = (fieldName, fieldValue) => {
    onChange({ ...value, [fieldName]: fieldValue }, fieldName);
  };

  const updateExample = (index, fieldName, fieldValue) => {
    const examples = value.examples.map((example, exampleIndex) => (
      exampleIndex === index
        ? { ...example, [fieldName]: fieldValue }
        : example
    ));

    onChange({ ...value, examples }, `examples.${index}.${fieldName}`);
  };

  const addExample = () => {
    onChange(
      { ...value, examples: [...value.examples, createEmptyExample()] },
      'examples',
    );
  };

  const removeExample = (index) => {
    onChange(
      {
        ...value,
        examples: value.examples.filter((_, exampleIndex) => exampleIndex !== index),
      },
      'examples',
    );
  };

  const fieldErrorId = (fieldName) => (
    errors[fieldName] ? `${idPrefix}-${fieldName}-error` : undefined
  );

  return (
    <div className={`card-content-fields card-content-fields--${mode}`}>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-front`}>Từ vựng (Mặt trước)</label>
        <textarea
          id={`${idPrefix}-front`}
          className="form-control"
          value={value.front}
          onChange={(event) => updateField('front', event.target.value)}
          rows="2"
          placeholder="Ví dụ: 覚悟"
          aria-invalid={Boolean(errors.front)}
          aria-describedby={fieldErrorId('front')}
        />
        {errors.front && (
          <p id={fieldErrorId('front')} className="add-cards-panel__field-error">
            {errors.front}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`${idPrefix}-back`}>Ý nghĩa (Mặt sau)</label>
        <textarea
          id={`${idPrefix}-back`}
          className="form-control"
          value={value.back}
          onChange={(event) => updateField('back', event.target.value)}
          rows="3"
          placeholder="Ví dụ: Quyết tâm, sẵn sàng"
          aria-invalid={Boolean(errors.back)}
          aria-describedby={fieldErrorId('back')}
        />
        {errors.back && (
          <p id={fieldErrorId('back')} className="add-cards-panel__field-error">
            {errors.back}
          </p>
        )}
      </div>

      <details className="card-content-advanced" defaultOpen={advancedDefaultOpen}>
        <summary>
          <span>Nội dung nâng cao</span>
          <small>Cách đọc, nội dung phát âm và ví dụ</small>
        </summary>

        <div className="card-content-advanced__body">
          <div className="form-group">
            <label htmlFor={`${idPrefix}-pronunciation`}>Cách đọc / Phiên âm</label>
            <textarea
              id={`${idPrefix}-pronunciation`}
              className="form-control"
              value={value.pronunciation}
              onChange={(event) => updateField('pronunciation', event.target.value)}
              rows="2"
              placeholder="Ví dụ: かくご hoặc /dɪˈtɜː.mɪnd/"
            />
          </div>

          <div className="form-group">
            <label htmlFor={`${idPrefix}-speech-text`}>Nội dung đọc thay thế</label>
            <textarea
              id={`${idPrefix}-speech-text`}
              className="form-control"
              value={value.speechText}
              onChange={(event) => updateField('speechText', event.target.value)}
              rows="2"
              placeholder="Chỉ nhập khi trình duyệt phát âm từ không đúng"
            />
            <p className="card-content-field-hint">
              Chuỗi này chỉ dùng cho TTS, không thay đổi nội dung hiển thị.
            </p>
          </div>

          <section className="card-examples-editor" aria-labelledby={`${idPrefix}-examples-title`}>
            <div className="card-examples-editor__header">
              <div>
                <h4 id={`${idPrefix}-examples-title`}>Danh sách ví dụ</h4>
                <p>Mỗi ví dụ có thể có bản dịch và nội dung TTS riêng.</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary card-examples-editor__add"
                onClick={addExample}
              >
                <Plus size={17} aria-hidden="true" />
                Thêm ví dụ
              </button>
            </div>

            {value.examples.length === 0 ? (
              <p className="card-examples-editor__empty">Chưa có ví dụ nào.</p>
            ) : (
              <div className="card-examples-editor__list">
                {value.examples.map((example, index) => {
                  const exampleError = errors.examples?.[index];

                  return (
                    <article key={`${idPrefix}-example-${index}`} className="card-example-editor">
                      <div className="card-example-editor__header">
                        <strong>Ví dụ {index + 1}</strong>
                        <button
                          type="button"
                          className="card-example-editor__remove"
                          onClick={() => removeExample(index)}
                          aria-label={`Xóa ví dụ ${index + 1}`}
                          title={`Xóa ví dụ ${index + 1}`}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>

                      <label htmlFor={`${idPrefix}-example-${index}-text`}>Câu ví dụ</label>
                      <textarea
                        id={`${idPrefix}-example-${index}-text`}
                        className="form-control"
                        value={example.text}
                        onChange={(event) => updateExample(index, 'text', event.target.value)}
                        rows="2"
                        aria-invalid={Boolean(exampleError)}
                        aria-describedby={exampleError ? `${idPrefix}-example-${index}-error` : undefined}
                      />
                      {exampleError && (
                        <p
                          id={`${idPrefix}-example-${index}-error`}
                          className="add-cards-panel__field-error"
                        >
                          {exampleError}
                        </p>
                      )}

                      <label htmlFor={`${idPrefix}-example-${index}-translation`}>Nghĩa ví dụ</label>
                      <textarea
                        id={`${idPrefix}-example-${index}-translation`}
                        className="form-control"
                        value={example.translation}
                        onChange={(event) => updateExample(index, 'translation', event.target.value)}
                        rows="2"
                      />

                      <label htmlFor={`${idPrefix}-example-${index}-tts`}>Nội dung đọc thay thế</label>
                      <textarea
                        id={`${idPrefix}-example-${index}-tts`}
                        className="form-control"
                        value={example.ttsText}
                        onChange={(event) => updateExample(index, 'ttsText', event.target.value)}
                        rows="2"
                        placeholder="Để trống nếu trình duyệt đọc câu ví dụ đúng"
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </details>
    </div>
  );
};

export default CardContentFields;
